const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");
const inscricoesMonitoriaAbertas = require("../utils/inscricoesMonitoriaAbertas");
const sanitizarEditalMonitoria = require("../utils/sanitizarEditalMonitoria");
const storageService = require("./storage.service");
const emailService = require("./email.service");
const emailMonitoria = require("./emailMonitoria.service");
const { criarInscricaoMonitoriaSchema } = require("../validators/monitoria.validators");

// Inscrição e seleção de monitores de uma edição. O candidato se inscreve
// logado (área do participante); a Coordenação de Monitoria (seção
// MONITORIA do admin) decide a situação de cada um e divulga o resultado uma
// vez por edição, com e-mail em segundo plano no mesmo molde de
// resultadoSubmissoes.service.js.

const PASTA_AUTORIZACOES = "monitoria-autorizacoes";

// Resend aceita 2 req/s por padrão — envio sequencial com folga.
const INTERVALO_ENVIO_MS = 600;
// Um envio em andamento por edição (processo único no Railway). Se o servidor
// reiniciar no meio, "Reenviar pendentes" retoma de onde parou.
const enviosEmAndamento = new Set();

const CAMPOS_EDICAO = {
  id: true,
  nome: true,
  numero: true,
  dataInicio: true,
  dataFim: true,
  inicioInscricoesMonitoria: true,
  fimInscricoesMonitoria: true,
  vagasMonitoria: true,
  funcoesMonitoria: true,
  editalMonitoria: true,
  destaqueMonitoria: true,
  corFundoDestaqueMonitoria: true,
  corTextoDestaqueMonitoria: true,
  cienteFormacaoMonitoria: true,
  cienteDisponibilidadeMonitoria: true,
  cienteVoluntariaMonitoria: true,
  resultadoMonitoriaDivulgadoEm: true,
};

const CAMPOS_USUARIO = {
  id: true,
  nome: true,
  email: true,
  cpf: true,
  documentoEstrangeiro: true,
  pais: true,
};

function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

async function buscarEdicao(edicaoId, db = prisma) {
  const edicao = await db.edicao.findUnique({ where: { id: edicaoId }, select: CAMPOS_EDICAO });
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
  return edicao;
}

// A idade conta no primeiro dia do evento; sem data cadastrada, hoje.
function dataReferenciaIdade(edicao) {
  return edicao.dataInicio || new Date();
}

// ---------------------------------------------------------------------------
// Candidato
// ---------------------------------------------------------------------------

// O candidato só vê a decisão depois da divulgação; antes disso, qualquer
// situação que não seja desistência aparece como "em análise". Nunca recebe a
// observação interna nem o caminho do arquivo.
function projetarParaCandidato(inscricao, edicao) {
  if (!inscricao) return null;
  const divulgado = Boolean(edicao.resultadoMonitoriaDivulgadoEm);
  const status = divulgado || inscricao.status === "CANCELADA" ? inscricao.status : "EM_ANALISE";

  return {
    id: inscricao.id,
    dataNascimento: inscricao.dataNascimento,
    pronome: inscricao.pronome,
    telefone: inscricao.telefone,
    cursoInstituicao: inscricao.cursoInstituicao,
    experienciaAnterior: inscricao.experienciaAnterior,
    funcoes: inscricao.funcoes,
    precisaAdaptacao: inscricao.precisaAdaptacao,
    adaptacoesNecessarias: inscricao.adaptacoesNecessarias,
    temAutorizacao: Boolean(inscricao.autorizacaoResponsavel),
    status,
    posicaoListaEspera: status === "LISTA_ESPERA" ? inscricao.posicaoListaEspera : null,
    createdAt: inscricao.createdAt,
    updatedAt: inscricao.updatedAt,
  };
}

function projetarEdicaoParaCandidato(edicao) {
  return {
    id: edicao.id,
    nome: edicao.nome,
    numero: edicao.numero,
    dataInicio: edicao.dataInicio,
    dataFim: edicao.dataFim,
    inicioInscricoesMonitoria: edicao.inicioInscricoesMonitoria,
    fimInscricoesMonitoria: edicao.fimInscricoesMonitoria,
    funcoesMonitoria: edicao.funcoesMonitoria,
    // Já sanitizado ao salvar e público em /monitoria; o painel do candidato
    // abre a chamada num modal.
    editalMonitoria: edicao.editalMonitoria,
    cienteFormacaoMonitoria: edicao.cienteFormacaoMonitoria,
    cienteDisponibilidadeMonitoria: edicao.cienteDisponibilidadeMonitoria,
    cienteVoluntariaMonitoria: edicao.cienteVoluntariaMonitoria,
    resultadoDivulgado: Boolean(edicao.resultadoMonitoriaDivulgadoEm),
  };
}

async function buscarInscricao(usuarioId, edicaoId, db = prisma) {
  return db.inscricaoMonitoria.findUnique({ where: { usuarioId_edicaoId: { usuarioId, edicaoId } } });
}

async function buscarMinha(usuarioId, edicaoId) {
  const edicao = await buscarEdicao(edicaoId);
  const inscricao = await buscarInscricao(usuarioId, edicaoId);
  return {
    edicao: projetarEdicaoParaCandidato(edicao),
    aberta: inscricoesMonitoriaAbertas(edicao),
    inscricao: projetarParaCandidato(inscricao, edicao),
  };
}

// Cria ou edita a candidatura. Só com a janela aberta e antes da divulgação.
// Quem tinha desistido e se inscreve de novo volta para "em análise".
async function salvar(usuarioId, edicaoId, corpo) {
  const edicao = await buscarEdicao(edicaoId);
  if (!inscricoesMonitoriaAbertas(edicao)) {
    throw new ErroHttp(409, "As inscrições para a monitoria não estão abertas.");
  }
  if (edicao.resultadoMonitoriaDivulgadoEm) {
    throw new ErroHttp(409, "O resultado da seleção já foi divulgado — a inscrição não pode mais ser alterada.");
  }
  if (edicao.funcoesMonitoria.length === 0) {
    throw new ErroHttp(409, "A lista de atividades da monitoria ainda não foi cadastrada.");
  }

  const existente = await buscarInscricao(usuarioId, edicaoId);
  const dados = criarInscricaoMonitoriaSchema({
    funcoesPermitidas: edicao.funcoesMonitoria,
    dataReferencia: dataReferenciaIdade(edicao),
    temAutorizacaoSalva: Boolean(existente?.autorizacaoResponsavel),
  }).parse(corpo);

  // Autorização só vale para menor: nova enviada substitui a antiga; se a
  // pessoa corrigiu a data e não é mais menor, a antiga é descartada.
  let autorizacaoResponsavel = existente?.autorizacaoResponsavel || null;
  let arquivoNovo = null;
  let arquivoParaRemover = null;
  if (dados.menor && dados.autorizacaoResponsavel) {
    arquivoNovo = await storageService.salvarArquivoPrivado(dados.autorizacaoResponsavel, PASTA_AUTORIZACOES);
    arquivoParaRemover = autorizacaoResponsavel;
    autorizacaoResponsavel = arquivoNovo;
  } else if (!dados.menor && autorizacaoResponsavel) {
    arquivoParaRemover = autorizacaoResponsavel;
    autorizacaoResponsavel = null;
  }

  const campos = {
    dataNascimento: new Date(`${dados.dataNascimento}T00:00:00.000Z`),
    pronome: dados.pronome,
    telefone: dados.telefone,
    cursoInstituicao: dados.cursoInstituicao,
    experienciaAnterior: dados.experienciaAnterior,
    funcoes: dados.funcoes,
    precisaAdaptacao: dados.precisaAdaptacao,
    adaptacoesNecessarias: dados.adaptacoesNecessarias,
    cienteEm: new Date(),
    autorizacaoResponsavel,
  };

  let inscricao;
  try {
    inscricao = existente
      ? await prisma.inscricaoMonitoria.update({
          where: { id: existente.id },
          data: {
            ...campos,
            ...(existente.status === "CANCELADA" ? { status: "EM_ANALISE", posicaoListaEspera: null } : {}),
          },
        })
      : await prisma.inscricaoMonitoria.create({ data: { ...campos, usuarioId, edicaoId } });
  } catch (erro) {
    if (arquivoNovo) await storageService.removerArquivoPrivado(arquivoNovo).catch(() => {});
    throw erro;
  }

  if (arquivoParaRemover) {
    await storageService.removerArquivoPrivado(arquivoParaRemover).catch((erro) => {
      console.error("[monitoria] Falha ao remover autorização antiga:", erro.message);
    });
  }

  return { inscricao: projetarParaCandidato(inscricao, edicao), criada: !existente };
}

// Desistência (edital, item 8.1.1) — permitida a qualquer momento.
async function cancelar(usuarioId, edicaoId) {
  const edicao = await buscarEdicao(edicaoId);
  const inscricao = await buscarInscricao(usuarioId, edicaoId);
  if (!inscricao) throw new ErroHttp(404, "Inscrição não encontrada.");
  if (inscricao.status === "CANCELADA") throw new ErroHttp(409, "Esta inscrição já foi cancelada.");

  const atualizada = await prisma.inscricaoMonitoria.update({
    where: { id: inscricao.id },
    data: { status: "CANCELADA", posicaoListaEspera: null },
  });
  return projetarParaCandidato(atualizada, edicao);
}

// ---------------------------------------------------------------------------
// Coordenação de Monitoria (admin)
// ---------------------------------------------------------------------------

function projetarParaCoordenacao(inscricao) {
  const { autorizacaoResponsavel, ...resto } = inscricao;
  return { ...resto, temAutorizacao: Boolean(autorizacaoResponsavel) };
}

async function estadoEnvio(edicaoId) {
  const pendentesWhere = { edicaoId, status: { in: emailMonitoria.STATUS_COM_EMAIL }, emailResultadoEnviadoEm: null };
  const [pendentes, comErro] = await Promise.all([
    prisma.inscricaoMonitoria.count({ where: pendentesWhere }),
    prisma.inscricaoMonitoria.count({ where: { ...pendentesWhere, emailResultadoErro: { not: null } } }),
  ]);
  return { enviando: enviosEmAndamento.has(edicaoId), emailsPendentes: pendentes, emailsComErro: comErro };
}

async function listar(edicaoId) {
  const edicao = await buscarEdicao(edicaoId);
  const inscricoes = await prisma.inscricaoMonitoria.findMany({
    where: { edicaoId },
    include: { usuario: { select: CAMPOS_USUARIO } },
    orderBy: { createdAt: "asc" },
  });

  return {
    edicao: { ...edicao, aberta: inscricoesMonitoriaAbertas(edicao) },
    inscricoes: inscricoes.map(projetarParaCoordenacao),
    estado: edicao.resultadoMonitoriaDivulgadoEm
      ? await estadoEnvio(edicaoId)
      : { enviando: false, emailsPendentes: 0, emailsComErro: 0 },
  };
}

async function buscarDaEdicao(edicaoId, id, db = prisma) {
  const inscricao = await db.inscricaoMonitoria.findFirst({ where: { id, edicaoId } });
  if (!inscricao) throw new ErroHttp(404, "Inscrição não encontrada.");
  return inscricao;
}

async function proximaPosicaoListaEspera(edicaoId, db) {
  const ultima = await db.inscricaoMonitoria.aggregate({
    where: { edicaoId, status: "LISTA_ESPERA" },
    _max: { posicaoListaEspera: true },
  });
  return (ultima._max.posicaoListaEspera || 0) + 1;
}

// Depois da divulgação, voltar para "em análise" não faz sentido (o resultado
// já saiu); qualquer outra mudança de situação/posição deixa o aviso por
// e-mail pendente de novo (ex.: promover alguém da lista de espera).
function camposReenvio(edicao, anterior, status, posicao) {
  if (!edicao.resultadoMonitoriaDivulgadoEm) return {};
  const mudou = anterior.status !== status || (anterior.posicaoListaEspera ?? null) !== (posicao ?? null);
  return mudou ? { emailResultadoEnviadoEm: null, emailResultadoErro: null } : {};
}

function exigirStatusPermitido(edicao, status) {
  if (edicao.resultadoMonitoriaDivulgadoEm && status === "EM_ANALISE") {
    throw new ErroHttp(409, "O resultado já foi divulgado — escolha uma situação final.");
  }
}

async function definirStatus(edicaoId, id, { status, posicaoListaEspera, observacaoCoordenacao }) {
  return prisma.$transaction(async (tx) => {
    const edicao = await buscarEdicao(edicaoId, tx);
    exigirStatusPermitido(edicao, status);
    const anterior = await buscarDaEdicao(edicaoId, id, tx);

    let posicao = null;
    if (status === "LISTA_ESPERA") {
      posicao =
        posicaoListaEspera ??
        (anterior.status === "LISTA_ESPERA" && anterior.posicaoListaEspera
          ? anterior.posicaoListaEspera
          : await proximaPosicaoListaEspera(edicaoId, tx));
    }

    const atualizada = await tx.inscricaoMonitoria.update({
      where: { id },
      data: {
        status,
        posicaoListaEspera: posicao,
        ...(observacaoCoordenacao !== undefined ? { observacaoCoordenacao: observacaoCoordenacao || null } : {}),
        ...camposReenvio(edicao, anterior, status, posicao),
      },
      include: { usuario: { select: CAMPOS_USUARIO } },
    });
    return projetarParaCoordenacao(atualizada);
  });
}

// Lote: quem entra na lista de espera recebe as próximas posições, na ordem
// em que os ids chegaram (a ordem da tabela na tela).
async function definirStatusEmLote(edicaoId, ids, status) {
  return prisma.$transaction(async (tx) => {
    const edicao = await buscarEdicao(edicaoId, tx);
    exigirStatusPermitido(edicao, status);

    const inscricoes = await tx.inscricaoMonitoria.findMany({ where: { edicaoId, id: { in: ids } } });
    if (inscricoes.length !== new Set(ids).size) {
      throw new ErroHttp(404, "Uma ou mais inscrições não foram encontradas nesta edição.");
    }
    const porId = new Map(inscricoes.map((inscricao) => [inscricao.id, inscricao]));

    let proxima = status === "LISTA_ESPERA" ? await proximaPosicaoListaEspera(edicaoId, tx) : null;
    for (const id of [...new Set(ids)]) {
      const anterior = porId.get(id);
      let posicao = null;
      if (status === "LISTA_ESPERA") {
        if (anterior.status === "LISTA_ESPERA" && anterior.posicaoListaEspera) {
          posicao = anterior.posicaoListaEspera;
        } else {
          posicao = proxima;
          proxima += 1;
        }
      }
      await tx.inscricaoMonitoria.update({
        where: { id },
        data: { status, posicaoListaEspera: posicao, ...camposReenvio(edicao, anterior, status, posicao) },
      });
    }
    return inscricoes.length;
  });
}

async function urlAutorizacao(edicaoId, id) {
  const inscricao = await buscarDaEdicao(edicaoId, id);
  if (!inscricao.autorizacaoResponsavel) throw new ErroHttp(404, "Esta inscrição não tem autorização anexada.");
  return storageService.gerarUrlAssinada(inscricao.autorizacaoResponsavel);
}

async function atualizarConfiguracao(edicaoId, dados) {
  const atual = await buscarEdicao(edicaoId);
  const data = { ...dados };
  if (dados.editalMonitoria !== undefined) {
    data.editalMonitoria = dados.editalMonitoria ? sanitizarEditalMonitoria(dados.editalMonitoria) || null : null;
  }

  // A regra "fim depois do início" também vale contra o valor já salvo
  // quando só uma das datas é enviada.
  const inicio = data.inicioInscricoesMonitoria !== undefined ? data.inicioInscricoesMonitoria : atual.inicioInscricoesMonitoria;
  const fim = data.fimInscricoesMonitoria !== undefined ? data.fimInscricoesMonitoria : atual.fimInscricoesMonitoria;
  if (inicio && fim && new Date(fim) <= new Date(inicio)) {
    throw new ErroHttp(400, "O fim das inscrições deve ser depois do início.");
  }

  const edicao = await prisma.edicao.update({ where: { id: edicaoId }, data, select: CAMPOS_EDICAO });
  return { ...edicao, aberta: inscricoesMonitoriaAbertas(edicao) };
}

async function divulgar(edicaoId) {
  await prisma.$transaction(async (tx) => {
    const edicao = await buscarEdicao(edicaoId, tx);
    if (edicao.resultadoMonitoriaDivulgadoEm) {
      throw new ErroHttp(409, "O resultado da monitoria já foi divulgado.");
    }

    const [ativas, emAnalise] = await Promise.all([
      tx.inscricaoMonitoria.count({ where: { edicaoId, status: { not: "CANCELADA" } } }),
      tx.inscricaoMonitoria.count({ where: { edicaoId, status: "EM_ANALISE" } }),
    ]);
    if (ativas === 0) throw new ErroHttp(409, "Não há inscrições para divulgar.");
    if (emAnalise > 0) {
      throw new ErroHttp(
        409,
        `Ainda há ${emAnalise} ${emAnalise === 1 ? "inscrição" : "inscrições"} em análise. Defina a situação de todas antes de divulgar.`
      );
    }

    await tx.edicao.update({ where: { id: edicaoId }, data: { resultadoMonitoriaDivulgadoEm: new Date() } });
  });

  iniciarEnvioEmSegundoPlano(edicaoId);
}

function iniciarEnvioEmSegundoPlano(edicaoId) {
  enviarEmailsPendentes(edicaoId).catch((erro) => {
    console.error(`[monitoria] Falha no envio de e-mails da edição ${edicaoId}:`, erro);
  });
}

async function reenviarPendentes(edicaoId) {
  const edicao = await buscarEdicao(edicaoId);
  if (!edicao.resultadoMonitoriaDivulgadoEm) throw new ErroHttp(409, "O resultado ainda não foi divulgado.");
  if (enviosEmAndamento.has(edicaoId)) throw new ErroHttp(409, "O envio dos e-mails já está em andamento.");
  iniciarEnvioEmSegundoPlano(edicaoId);
}

// Um e-mail por inscrição decidida ainda sem emailResultadoEnviadoEm. Falha
// numa inscrição marca o erro e segue para a próxima.
async function enviarEmailsPendentes(edicaoId) {
  if (enviosEmAndamento.has(edicaoId)) return;
  enviosEmAndamento.add(edicaoId);

  try {
    const edicao = await buscarEdicao(edicaoId);
    if (!edicao.resultadoMonitoriaDivulgadoEm) return;

    const inscricoes = await prisma.inscricaoMonitoria.findMany({
      where: { edicaoId, status: { in: emailMonitoria.STATUS_COM_EMAIL }, emailResultadoEnviadoEm: null },
      include: { usuario: { select: { nome: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });

    for (const inscricao of inscricoes) {
      try {
        const { assunto, html } = emailMonitoria.renderizar({
          status: inscricao.status,
          nome: inscricao.usuario.nome,
          edicao: edicao.nome,
          posicao: inscricao.posicaoListaEspera,
          edicaoId,
        });
        await emailService.enviarEmail({ para: inscricao.usuario.email, assunto, html });
        await prisma.inscricaoMonitoria.update({
          where: { id: inscricao.id },
          data: { emailResultadoEnviadoEm: new Date(), emailResultadoErro: null },
        });
      } catch (erro) {
        console.error(`[monitoria] E-mail da inscrição ${inscricao.id} falhou:`, erro.message);
        await prisma.inscricaoMonitoria.update({
          where: { id: inscricao.id },
          data: { emailResultadoErro: String(erro.message).slice(0, 500) },
        });
      }
      await esperar(INTERVALO_ENVIO_MS);
    }
  } finally {
    enviosEmAndamento.delete(edicaoId);
  }
}

module.exports = {
  buscarMinha,
  salvar,
  cancelar,
  listar,
  definirStatus,
  definirStatusEmLote,
  urlAutorizacao,
  atualizarConfiguracao,
  divulgar,
  reenviarPendentes,
};
