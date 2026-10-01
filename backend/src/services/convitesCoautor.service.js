const crypto = require("crypto");
const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");
const emailService = require("./email.service");
const usuariosService = require("./usuarios.service");

// Convite de cadastro para coautor sem conta (SubmissaoAutor.usuarioId null)
// — a importação do Even3 só criou conta para o autor principal, e coautor
// novo também entra solto. Um ConviteCoautor por e-mail (minúsculo): o link
// /cadastro?convite=<token> prova a posse do e-mail, então a conta nasce
// confirmada; quem já tem conta com outro e-mail usa o mesmo link em
// "Já tenho conta" (vincularAConta).

const VALIDADE_DIAS = 60;
// Resend aceita 2 req/s por padrão — envio sequencial com folga, como em
// resultadoSubmissoes.service.js.
const INTERVALO_ENVIO_MS = 600;
const INTERVALO_REENVIO_AUTOR_MS = 24 * 60 * 60 * 1000;

// Fila global (o convite não é por edição) em memória, processo único no
// Railway. Se o servidor reiniciar no meio, "Enviar convites pendentes" no
// admin retoma: só quem ainda não recebeu (ou teve falha) é reenfileirado.
const fila = new Set();
let processando = false;

function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

function novoToken() {
  return crypto.randomBytes(32).toString("hex");
}

function novaValidade() {
  return new Date(Date.now() + VALIDADE_DIAS * 24 * 60 * 60 * 1000);
}

function chaveEmail(email) {
  return usuariosService.normalizarEmail(email);
}

function formatarDataHora(data) {
  return new Date(data).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function autoriasSoltas(email) {
  return prisma.submissaoAutor.findMany({
    where: { usuarioId: null, email: { equals: email, mode: "insensitive" } },
    select: { id: true, nome: true, submissaoId: true, submissao: { select: { titulo: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// Garante um convite para cada e-mail que ainda não tem conta. E-mail que já
// ganhou conta (caixa diferente, cadastro por fora) tem as autorias ligadas
// na hora em vez de receber convite. Devolve os convites dos e-mails sem conta.
async function garantirConvites(emails) {
  const unicos = [...new Set(emails.map(chaveEmail))];
  if (unicos.length === 0) return [];

  const semConta = [];
  for (const email of unicos) {
    const conta = await usuariosService.buscarPorEmail(email);
    if (conta) {
      await usuariosService.associarAutoriasPendentes(conta.id, email);
    } else {
      semConta.push(email);
    }
  }
  if (semConta.length === 0) return [];

  await prisma.conviteCoautor.createMany({
    data: semConta.map((email) => ({ email, token: novoToken(), expiraEm: novaValidade() })),
    skipDuplicates: true,
  });

  // Convite já usado com "Já tenho conta" (a conta tem outro e-mail) e o
  // e-mail voltou a ter autoria solta (organização trocou o e-mail de um
  // coautor para ele, por exemplo): reativa com token novo.
  const usados = await prisma.conviteCoautor.findMany({
    where: { email: { in: semConta }, usadoEm: { not: null } },
    select: { id: true },
  });
  for (const { id } of usados) {
    await prisma.conviteCoautor.update({
      where: { id },
      data: {
        token: novoToken(),
        expiraEm: novaValidade(),
        usadoEm: null,
        usuarioId: null,
        enviadoEm: null,
        erroEnvio: null,
      },
    });
  }
  return prisma.conviteCoautor.findMany({ where: { email: { in: semConta } } });
}

function enfileirar(conviteIds) {
  conviteIds.forEach((id) => fila.add(id));
  processarFila().catch((erro) => console.error("[convite-coautor] Falha na fila de envio:", erro));
  return conviteIds.length;
}

async function processarFila() {
  if (processando) return;
  processando = true;
  try {
    while (fila.size > 0) {
      const [id] = fila;
      try {
        const enviou = await enviarConvite(id);
        if (enviou) await esperar(INTERVALO_ENVIO_MS);
      } catch (erro) {
        console.error(`[convite-coautor] Falha ao processar o convite ${id}:`, erro);
      } finally {
        fila.delete(id);
      }
    }
  } finally {
    processando = false;
  }
}

// true quando chegou a chamar o Resend (com sucesso ou não).
async function enviarConvite(id) {
  const convite = await prisma.conviteCoautor.findUnique({ where: { id } });
  if (!convite || convite.usadoEm) return false;

  const conta = await usuariosService.buscarPorEmail(convite.email);
  if (conta) {
    await usuariosService.associarAutoriasPendentes(conta.id, convite.email);
    await prisma.conviteCoautor.update({ where: { id }, data: { usadoEm: new Date(), usuarioId: conta.id } });
    return false;
  }

  const autorias = await autoriasSoltas(convite.email);
  if (autorias.length === 0) return false;

  const titulos = [...new Set(autorias.map((autoria) => autoria.submissao.titulo))];
  // O reenvio estende a validade e mantém o token: links de e-mails
  // anteriores continuam valendo.
  const expiraEm = novaValidade();
  try {
    await emailService.enviarEmailConviteCoautor({
      email: convite.email,
      nome: autorias[0].nome,
      titulos,
      token: convite.token,
    });
    await prisma.conviteCoautor.update({
      where: { id },
      data: { enviadoEm: new Date(), erroEnvio: null, expiraEm },
    });
  } catch (erro) {
    console.error(`[convite-coautor] E-mail para ${convite.email} falhou:`, erro.message);
    await prisma.conviteCoautor.update({
      where: { id },
      data: { erroEnvio: String(erro.message).slice(0, 500) },
    });
  }
  return true;
}

function pendente(convite) {
  return !convite.enviadoEm || Boolean(convite.erroEnvio);
}

// Depois de cada submissão nova (envio público, área do participante e
// inserção pela organização). Nunca derruba a criação da submissão.
function convidarCoautoresDaSubmissao(submissaoId) {
  (async () => {
    const autorias = await prisma.submissaoAutor.findMany({
      where: { submissaoId, usuarioId: null },
      select: { email: true },
    });
    const convites = await garantirConvites(autorias.map((autoria) => autoria.email));
    enfileirar(convites.filter(pendente).map((convite) => convite.id));
  })().catch((erro) => console.error(`[convite-coautor] Falha ao convidar coautores da submissão ${submissaoId}:`, erro));
}

// Botão "Enviar convites pendentes" do admin: todos os coautores soltos da
// edição que ainda não receberam ou tiveram falha no envio.
async function enviarPendentesDaEdicao(edicaoId) {
  const autorias = await prisma.submissaoAutor.findMany({
    where: { usuarioId: null, submissao: { edicaoId } },
    select: { email: true },
  });
  const convites = await garantirConvites(autorias.map((autoria) => autoria.email));
  return enfileirar(convites.filter((convite) => pendente(convite) && !fila.has(convite.id)).map((convite) => convite.id));
}

// Envio (ou reenvio) escolhido pela organização — manda mesmo para quem já
// recebeu.
async function enviarParaAutorias(edicaoId, autorIds) {
  const autorias = await prisma.submissaoAutor.findMany({
    where: { id: { in: autorIds }, usuarioId: null, submissao: { edicaoId } },
    select: { email: true },
  });
  const convites = await garantirConvites(autorias.map((autoria) => autoria.email));
  return enfileirar(convites.map((convite) => convite.id));
}

// Reenvio pelo autor principal em "Minhas submissões", no máximo um a cada
// 24 h por coautor.
async function reenviarPeloAutorPrincipal(usuarioId, submissaoId, autorId) {
  const autoria = await prisma.submissaoAutor.findFirst({
    where: { id: autorId, submissaoId, principal: false, submissao: { usuarioId } },
    select: { email: true, usuarioId: true },
  });
  if (!autoria) throw new ErroHttp(404, "Coautor não encontrado.");
  if (autoria.usuarioId) throw new ErroHttp(409, "Este coautor já tem cadastro na plataforma.");

  const [convite] = await garantirConvites([autoria.email]);
  if (!convite) throw new ErroHttp(409, "Este coautor já tem cadastro na plataforma.");
  if (fila.has(convite.id)) throw new ErroHttp(409, "O convite deste coautor já está sendo enviado.");
  if (convite.enviadoEm && Date.now() - convite.enviadoEm.getTime() < INTERVALO_REENVIO_AUTOR_MS) {
    throw new ErroHttp(
      409,
      `O convite foi enviado em ${formatarDataHora(convite.enviadoEm)}. Aguarde 24 horas para reenviar.`
    );
  }
  enfileirar([convite.id]);
}

async function mapaConvites(emails) {
  const unicos = [...new Set(emails.map(chaveEmail))];
  if (unicos.length === 0) return new Map();
  const convites = await prisma.conviteCoautor.findMany({ where: { email: { in: unicos } } });
  return new Map(convites.map((convite) => [convite.email, convite]));
}

// CADASTRADO | NA_FILA | FALHA_ENVIO | CONVITE_ENVIADO | NAO_ENVIADO
function situacaoAutoria(autoria, convites) {
  if (autoria.usuarioId) return { situacao: "CADASTRADO", enviadoEm: null, conviteId: null };
  const convite = convites.get(chaveEmail(autoria.email));
  if (!convite || convite.usadoEm) return { situacao: "NAO_ENVIADO", enviadoEm: null, conviteId: convite?.id || null };

  let situacao = "NAO_ENVIADO";
  if (fila.has(convite.id)) situacao = "NA_FILA";
  else if (convite.erroEnvio) situacao = "FALHA_ENVIO";
  else if (convite.enviadoEm) situacao = "CONVITE_ENVIADO";
  return { situacao, enviadoEm: convite.enviadoEm, conviteId: convite.id, erroEnvio: convite.erroEnvio };
}

function statusEnvio() {
  return { enviando: processando || fila.size > 0, naFila: fila.size };
}

async function buscarConviteValido(token) {
  const convite = token ? await prisma.conviteCoautor.findUnique({ where: { token: String(token) } }) : null;
  if (!convite || convite.usadoEm || convite.expiraEm < new Date()) {
    throw new ErroHttp(400, "Link de convite inválido ou expirado. Peça um novo ao autor principal do trabalho ou à organização.");
  }
  return convite;
}

// Dados para a página de cadastro (/cadastro?convite=). Quem abre o link tem
// o e-mail, então pode ver os títulos.
async function detalharParaCadastro(token) {
  const convite = await buscarConviteValido(token);
  if (await usuariosService.buscarPorEmail(convite.email)) {
    throw new ErroHttp(409, "Já existe uma conta com este e-mail. Entre com ela — os trabalhos já estão vinculados.");
  }
  const autorias = await autoriasSoltas(convite.email);
  return {
    email: convite.email,
    nome: autorias[0]?.nome || "",
    titulos: [...new Set(autorias.map((autoria) => autoria.submissao.titulo))],
  };
}

// Depois que auth.controller criou a conta com o e-mail do convite.
async function marcarUsado(conviteId, usuarioId) {
  await prisma.conviteCoautor.updateMany({
    where: { id: conviteId, usadoEm: null },
    data: { usadoEm: new Date(), usuarioId },
  });
}

// "Já tenho conta": o token prova o e-mail do convite e o login prova a
// conta. As autorias passam a usar o e-mail da conta (é para ele que saem os
// e-mails de resultado), como em usuariosService.trocarProprioEmail. Pula
// trabalho em que a conta já é autora, para não duplicar a pessoa.
async function vincularAConta(token, usuarioId) {
  const convite = await buscarConviteValido(token);
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario || !usuario.ativo || usuario.anonimizadoEm) throw new ErroHttp(404, "Usuário não encontrado.");

  const autorias = await autoriasSoltas(convite.email);
  const jaAutora = await prisma.submissaoAutor.findMany({
    where: { usuarioId, submissaoId: { in: autorias.map((autoria) => autoria.submissaoId) } },
    select: { submissaoId: true },
  });
  const submissoesJaAutora = new Set(jaAutora.map((autoria) => autoria.submissaoId));
  const vincular = autorias.filter((autoria) => !submissoesJaAutora.has(autoria.submissaoId));

  await prisma.$transaction([
    prisma.submissaoAutor.updateMany({
      where: { id: { in: vincular.map((autoria) => autoria.id) } },
      data: { usuarioId, email: usuario.email },
    }),
    prisma.conviteCoautor.update({ where: { id: convite.id }, data: { usadoEm: new Date(), usuarioId } }),
  ]);
  return { titulos: [...new Set(vincular.map((autoria) => autoria.submissao.titulo))] };
}

module.exports = {
  garantirConvites,
  enfileirar,
  convidarCoautoresDaSubmissao,
  enviarPendentesDaEdicao,
  enviarParaAutorias,
  reenviarPeloAutorPrincipal,
  mapaConvites,
  situacaoAutoria,
  statusEnvio,
  buscarConviteValido,
  detalharParaCadastro,
  marcarUsado,
  vincularAConta,
};
