const prisma = require("../config/prisma");
const env = require("../config/env");
const ErroHttp = require("../utils/erroHttp");
const escaparHtml = require("../utils/escaparHtml");
const sanitizarCorpoContribuicao = require("../utils/sanitizarCorpoContribuicao");
const { marcadoresDesconhecidos, substituir, valoresPara } = require("../utils/marcadoresEmailMassa");
const emailService = require("./email.service");

// E-mails em massa (tela E-mails e "Enviar e-mail" da aba Usuários de
// Participantes) — só ADMIN. Modelos globais; cada envio guarda cópia do
// texto e um registro por destinatário, para acompanhar, ver falhas e
// retomar.

const LIMITE_DESTINATARIOS = 5000;
// Resend aceita 2 req/s por padrão — envio sequencial com folga, como em
// resultadoSubmissoes.service.js.
const INTERVALO_ENVIO_MS = 600;
const DESLOCAMENTO_BRASILIA_MS = 3 * 60 * 60 * 1000;

// Um processamento por envio (processo único no Railway). Se o servidor
// reiniciar no meio, "Retomar" continua dos destinatários sem enviadoEm.
const enviosEmAndamento = new Set();

function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

// Sanitiza o corpo e recusa marcador que não existe — melhor descobrir na
// hora de salvar do que ver "{{nme}}" chegar a centenas de pessoas.
function prepararTexto({ assunto, corpo }) {
  let corpoSanitizado;
  try {
    corpoSanitizado = sanitizarCorpoContribuicao(corpo);
  } catch (erro) {
    throw new ErroHttp(400, erro.message);
  }
  if (!corpoSanitizado.replace(/<[^>]*>/g, "").trim()) throw new ErroHttp(400, "Escreva o texto do e-mail.");

  const desconhecidos = [...new Set([...marcadoresDesconhecidos(assunto), ...marcadoresDesconhecidos(corpoSanitizado)])];
  if (desconhecidos.length > 0) {
    throw new ErroHttp(400, `Marcador desconhecido: ${desconhecidos.map((chave) => `{{${chave}}}`).join(", ")}.`);
  }
  return { assunto: assunto.trim(), corpo: corpoSanitizado };
}

function contextoDaEdicao(edicao) {
  return {
    edicao: edicao?.nome || "Narrativas",
    linkParticipante: `${env.frontendUrl}/participante`,
    linkSite: env.frontendUrl,
  };
}

function renderizar({ assunto, corpo }, valores) {
  const corpoHtml =
    substituir(corpo, valores, { html: true }).replace(/<p>\s*<\/p>/g, "") +
    '<p style="margin: 28px 0 0; font-size: 12px; opacity: 0.75;">Você recebeu este e-mail por ter cadastro na plataforma do Narrativas.</p>';
  return {
    assunto: substituir(assunto, valores, { html: false }),
    html: emailService.layoutEmailPublico({ eyebrow: "Comunicado", titulo: escaparHtml(valores.edicao), corpoHtml }),
  };
}

async function buscarEdicao(edicaoId) {
  if (!edicaoId) return null;
  const edicao = await prisma.edicao.findUnique({ where: { id: edicaoId }, select: { id: true, nome: true } });
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
  return edicao;
}

// --- Modelos ---

const CAMPOS_MODELO = { id: true, nome: true, assunto: true, corpo: true, createdAt: true, updatedAt: true };

async function listarModelos() {
  return prisma.modeloEmail.findMany({ select: CAMPOS_MODELO, orderBy: { nome: "asc" } });
}

async function criarModelo({ nome, assunto, corpo }) {
  return prisma.modeloEmail.create({
    data: { nome, ...prepararTexto({ assunto, corpo }) },
    select: CAMPOS_MODELO,
  });
}

async function buscarModelo(id) {
  const modelo = await prisma.modeloEmail.findUnique({ where: { id } });
  if (!modelo) throw new ErroHttp(404, "Modelo não encontrado.");
  return modelo;
}

async function atualizarModelo(id, { nome, assunto, corpo }) {
  await buscarModelo(id);
  return prisma.modeloEmail.update({
    where: { id },
    data: { nome, ...prepararTexto({ assunto, corpo }) },
    select: CAMPOS_MODELO,
  });
}

// Os envios feitos com ele guardam cópia do texto (modeloId vira null).
async function excluirModelo(id) {
  await buscarModelo(id);
  await prisma.modeloEmail.delete({ where: { id } });
}

// --- Envio ---

async function enviarTeste(usuario, { assunto, corpo, edicaoId }) {
  const texto = prepararTexto({ assunto, corpo });
  const edicao = await buscarEdicao(edicaoId);
  const { assunto: assuntoFinal, html } = renderizar(texto, valoresPara(usuario, contextoDaEdicao(edicao)));
  await emailService.enviarEmail({ para: usuario.email, assunto: `[Teste] ${assuntoFinal}`, html });
}

async function criarEnvio({ edicaoId, modeloId, usuarioIds, assunto, corpo }, criadoPorId) {
  const texto = prepararTexto({ assunto, corpo });
  const edicao = await buscarEdicao(edicaoId);
  if (modeloId) await buscarModelo(modeloId);

  const ids = [...new Set(usuarioIds)];
  if (ids.length > LIMITE_DESTINATARIOS) {
    throw new ErroHttp(400, `Selecione no máximo ${LIMITE_DESTINATARIOS} destinatários por envio.`);
  }

  // Conta desativada/anonimizada fica de fora; e-mail repetido (contas que só
  // diferem na caixa) recebe uma vez.
  const usuarios = await prisma.usuario.findMany({
    where: { id: { in: ids }, ativo: true, anonimizadoEm: null },
    select: { id: true, nome: true, email: true },
    orderBy: { nome: "asc" },
  });
  const vistos = new Set();
  const destinatarios = usuarios.filter((usuario) => {
    const chave = usuario.email.toLowerCase();
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
  if (destinatarios.length === 0) throw new ErroHttp(400, "Nenhum destinatário válido entre os selecionados.");

  const envio = await prisma.envioEmail.create({
    data: {
      edicaoId: edicao?.id || null,
      modeloId: modeloId || null,
      criadoPorId,
      ...texto,
      destinatarios: {
        createMany: {
          data: destinatarios.map((usuario) => ({ usuarioId: usuario.id, nome: usuario.nome, email: usuario.email })),
        },
      },
    },
  });

  iniciarEmSegundoPlano(envio.id);
  return { id: envio.id, total: destinatarios.length, ignorados: ids.length - destinatarios.length };
}

function iniciarEmSegundoPlano(envioId) {
  processarEnvio(envioId).catch((erro) => {
    console.error(`[emails-massa] Falha no envio ${envioId}:`, erro);
  });
}

// Manda para os destinatários sem enviadoEm (inclui os que falharam antes).
// 429 do Resend (limite de taxa ou cota esgotada, mesmo depois das novas
// tentativas de email.service.js) pausa o envio: o resto fica pendente para
// "Retomar".
async function processarEnvio(envioId) {
  if (enviosEmAndamento.has(envioId)) return;
  enviosEmAndamento.add(envioId);

  try {
    const envio = await prisma.envioEmail.findUnique({ where: { id: envioId }, include: { edicao: true } });
    if (!envio) return;
    const contexto = contextoDaEdicao(envio.edicao);
    const pendentes = await prisma.envioEmailDestinatario.findMany({
      where: { envioId, enviadoEm: null },
      orderBy: { nome: "asc" },
    });

    let pausado = false;
    for (const destinatario of pendentes) {
      try {
        const { assunto, html } = renderizar(envio, valoresPara(destinatario, contexto));
        await emailService.enviarEmail({ para: destinatario.email, assunto, html });
        await prisma.envioEmailDestinatario.update({
          where: { id: destinatario.id },
          data: { enviadoEm: new Date(), erro: null },
        });
      } catch (erro) {
        console.error(`[emails-massa] E-mail para ${destinatario.email} falhou:`, erro.message);
        await prisma.envioEmailDestinatario.update({
          where: { id: destinatario.id },
          data: { erro: String(erro.message).slice(0, 500) },
        });
        if (/\(429\)/.test(erro.message)) {
          pausado = true;
          break;
        }
      }
      await esperar(INTERVALO_ENVIO_MS);
    }

    if (!pausado) {
      const restantes = await prisma.envioEmailDestinatario.count({ where: { envioId, enviadoEm: null } });
      await prisma.envioEmail.update({
        where: { id: envioId },
        data: { concluidoEm: restantes === 0 ? new Date() : null },
      });
    }
  } finally {
    enviosEmAndamento.delete(envioId);
  }
}

async function retomar(envioId) {
  const envio = await prisma.envioEmail.findUnique({ where: { id: envioId }, select: { id: true } });
  if (!envio) throw new ErroHttp(404, "Envio não encontrado.");
  if (enviosEmAndamento.has(envioId)) throw new ErroHttp(409, "Este envio já está em andamento.");
  const pendentes = await prisma.envioEmailDestinatario.count({ where: { envioId, enviadoEm: null } });
  if (pendentes === 0) throw new ErroHttp(409, "Todos os e-mails deste envio já foram enviados.");
  iniciarEmSegundoPlano(envioId);
  return { pendentes };
}

// --- Histórico ---

async function contagensPorEnvio(envioIds) {
  const [totais, enviados, falhas] = await Promise.all(
    [{}, { enviadoEm: { not: null } }, { enviadoEm: null, erro: { not: null } }].map((filtro) =>
      prisma.envioEmailDestinatario.groupBy({
        by: ["envioId"],
        where: { envioId: { in: envioIds }, ...filtro },
        _count: { _all: true },
      })
    )
  );
  const mapa = (linhas) => new Map(linhas.map((linha) => [linha.envioId, linha._count._all]));
  return { totais: mapa(totais), enviados: mapa(enviados), falhas: mapa(falhas) };
}

function resumirEnvio(envio, contagens) {
  const total = contagens.totais.get(envio.id) || 0;
  const enviados = contagens.enviados.get(envio.id) || 0;
  const falhas = contagens.falhas.get(envio.id) || 0;
  return {
    id: envio.id,
    assunto: envio.assunto,
    modelo: envio.modelo,
    criadoPor: envio.criadoPor,
    createdAt: envio.createdAt,
    concluidoEm: envio.concluidoEm,
    total,
    enviados,
    falhas,
    pendentes: total - enviados - falhas,
    emAndamento: enviosEmAndamento.has(envio.id),
  };
}

const INCLUDE_ENVIO = {
  modelo: { select: { id: true, nome: true } },
  criadoPor: { select: { id: true, nome: true } },
};

async function listarEnvios(edicaoId) {
  const envios = await prisma.envioEmail.findMany({
    where: { edicaoId },
    include: INCLUDE_ENVIO,
    orderBy: { createdAt: "desc" },
  });
  const contagens = await contagensPorEnvio(envios.map((envio) => envio.id));
  return envios.map((envio) => resumirEnvio(envio, contagens));
}

async function detalharEnvio(id) {
  const envio = await prisma.envioEmail.findUnique({
    where: { id },
    include: {
      ...INCLUDE_ENVIO,
      destinatarios: {
        select: { id: true, nome: true, email: true, enviadoEm: true, erro: true },
        orderBy: { nome: "asc" },
      },
    },
  });
  if (!envio) throw new ErroHttp(404, "Envio não encontrado.");
  const contagens = await contagensPorEnvio([envio.id]);
  return { ...resumirEnvio(envio, contagens), corpo: envio.corpo, destinatarios: envio.destinatarios };
}

// Só os e-mails em massa — os automáticos (convites, inscrições, resultado)
// não ficam registrados, mas contam na mesma cota do Resend.
async function usoMensal() {
  const agoraBrasilia = new Date(Date.now() - DESLOCAMENTO_BRASILIA_MS);
  const inicioDoMes = new Date(
    Date.UTC(agoraBrasilia.getUTCFullYear(), agoraBrasilia.getUTCMonth(), 1) + DESLOCAMENTO_BRASILIA_MS
  );
  const enviadosNoMes = await prisma.envioEmailDestinatario.count({ where: { enviadoEm: { gte: inicioDoMes } } });
  return { enviadosNoMes, limite: env.emailLimiteMensal };
}

module.exports = {
  LIMITE_DESTINATARIOS,
  listarModelos,
  criarModelo,
  atualizarModelo,
  excluirModelo,
  enviarTeste,
  criarEnvio,
  retomar,
  listarEnvios,
  detalharEnvio,
  usoMensal,
};
