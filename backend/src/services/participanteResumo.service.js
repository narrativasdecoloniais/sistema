const prisma = require("../config/prisma");
const inscricoesAbertas = require("../utils/inscricoesAbertas");
const inscricoesMonitoriaAbertas = require("../utils/inscricoesMonitoriaAbertas");
const prazoSubmissaoAberto = require("../utils/prazoSubmissaoAberto");
const { prazoCorrecaoAberto } = require("../utils/prazoCorrecao");
const { agoraIngenuo, hojeIngenuo } = require("../utils/horarioBrasilia");
const avaliacoesService = require("./avaliacoes.service");
const certificadosService = require("./certificados.service");

// Tela "Início" da área do participante: a situação da pessoa em cada recurso
// e o que ela tem a fazer agora. Só agrega — as regras (janelas, divulgação,
// prazo de correção, avaliação cega) são as mesmas dos endpoints de cada tela.

const CAMPOS_EDICAO = {
  id: true,
  nome: true,
  numero: true,
  dataInicio: true,
  dataFim: true,
  inicioInscricoes: true,
  fimInscricoes: true,
  inscricoesEncerradasManualmente: true,
  inicioInscricoesMonitoria: true,
  fimInscricoesMonitoria: true,
  funcoesMonitoria: true,
  editalMonitoria: true,
  resultadoMonitoriaDivulgadoEm: true,
  modalidadesSubmissao: { select: { prazoInicio: true, prazoFim: true } },
};

function dia(data) {
  return new Date(data).toISOString().slice(0, 10);
}

// Do primeiro ao último dia do evento (mesma janela do QR geral).
function periodoDoEvento(edicao) {
  if (!edicao.dataInicio) return false;
  const hoje = hojeIngenuo();
  return hoje >= dia(edicao.dataInicio) && hoje <= dia(edicao.dataFim || edicao.dataInicio);
}

async function resumoInscricao(usuarioId, edicao) {
  const [inscricao, atividades] = await Promise.all([
    prisma.inscricaoEdicao.findUnique({
      where: { usuarioId_edicaoId: { usuarioId, edicaoId: edicao.id } },
      select: { credenciadoEm: true },
    }),
    prisma.inscricaoAtividade.groupBy({
      by: ["status"],
      where: { usuarioId, atividade: { edicaoId: edicao.id } },
      _count: true,
    }),
  ]);
  const contagem = (status) => atividades.find((item) => item.status === status)?._count || 0;
  return {
    aberta: inscricoesAbertas(edicao),
    fim: edicao.fimInscricoes,
    inscrito: Boolean(inscricao),
    confirmadas: contagem("CONFIRMADA"),
    listaEspera: contagem("LISTA_ESPERA"),
    credenciadoEm: inscricao?.credenciadoEm || null,
    periodoDoEvento: periodoDoEvento(edicao),
  };
}

// Sem edital publicado a monitoria não existe para o participante.
async function resumoMonitoria(usuarioId, edicao) {
  if (!edicao.editalMonitoria) return null;
  const inscricao = await prisma.inscricaoMonitoria.findUnique({
    where: { usuarioId_edicaoId: { usuarioId, edicaoId: edicao.id } },
    select: { status: true },
  });
  const divulgado = Boolean(edicao.resultadoMonitoriaDivulgadoEm);
  // Mesma projeção de monitoria.service.js: a decisão só aparece depois da divulgação.
  const status = !inscricao
    ? null
    : divulgado || inscricao.status === "CANCELADA"
      ? inscricao.status
      : "EM_ANALISE";
  return {
    aberta: inscricoesMonitoriaAbertas(edicao) && !divulgado && edicao.funcoesMonitoria.length > 0,
    fim: edicao.fimInscricoesMonitoria,
    status,
  };
}

async function resumoSubmissoes(usuarioId, edicao) {
  const submissoes = await prisma.submissao.findMany({
    where: { autores: { some: { usuarioId } } },
    select: {
      id: true,
      titulo: true,
      usuarioId: true,
      statusCorrecao: true,
      edicao: {
        select: { slug: true, resultadoDivulgadoEm: true, prazoCorrecaoSubmissao: true, apresentacaoPublicadaEm: true },
      },
      atividadeApresentacao: {
        select: { nome: true, slug: true, local: true, inicioAtividade: true, fimAtividade: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Mesmo critério de podeCorrigir em participanteSubmissoes.controller.js.
  const correcoes = submissoes
    .filter(
      (submissao) =>
        submissao.usuarioId === usuarioId &&
        submissao.edicao.resultadoDivulgadoEm &&
        prazoCorrecaoAberto(submissao.edicao.prazoCorrecaoSubmissao) &&
        ["PENDENTE", "DEVOLVIDA"].includes(submissao.statusCorrecao)
    )
    .map((submissao) => ({
      id: submissao.id,
      titulo: submissao.titulo,
      devolvida: submissao.statusCorrecao === "DEVOLVIDA",
      prazo: submissao.edicao.prazoCorrecaoSubmissao,
    }));

  // Mesma regra de Minhas submissões (só com a distribuição publicada), e só
  // as que ainda não terminaram — depois do evento o lembrete vira ruído.
  const agora = agoraIngenuo();
  const apresentacoes = submissoes
    .filter(
      (submissao) =>
        submissao.edicao.apresentacaoPublicadaEm &&
        submissao.atividadeApresentacao &&
        submissao.atividadeApresentacao.fimAtividade >= agora
    )
    .map((submissao) => ({
      id: submissao.id,
      titulo: submissao.titulo,
      edicaoSlug: submissao.edicao.slug,
      atividade: submissao.atividadeApresentacao,
    }))
    .sort((a, b) => a.atividade.inicioAtividade - b.atividade.inicioAtividade);

  const modalidadesAbertas = (edicao?.modalidadesSubmissao || []).filter((modalidade) =>
    prazoSubmissaoAberto(modalidade.prazoInicio, modalidade.prazoFim)
  );
  const fimRecebimento = modalidadesAbertas.reduce(
    (maior, modalidade) => (!maior || modalidade.prazoFim > maior ? modalidade.prazoFim : maior),
    null
  );

  return {
    total: submissoes.length,
    recebendo: modalidadesAbertas.length > 0,
    fimRecebimento,
    correcoes,
    apresentacoes,
  };
}

// Só para quem tem atribuições — o card nem aparece para os demais.
async function resumoAvaliacoes(usuarioId) {
  const atribuicoes = await avaliacoesService.listarMinhasAtribuicoes(usuarioId);
  if (atribuicoes.length === 0) return null;
  return {
    total: atribuicoes.length,
    pendentes: atribuicoes.filter((atribuicao) => atribuicao.status === "PENDENTE").length,
  };
}

async function resumoCertificados(usuarioId) {
  const certificados = await certificadosService.listarDoParticipante(usuarioId);
  return { total: certificados.length };
}

async function resumir(usuarioId) {
  const edicao = await prisma.edicao.findFirst({ orderBy: { numero: "desc" }, select: CAMPOS_EDICAO });

  const [inscricao, monitoria, submissoes, avaliacoes, certificados] = await Promise.all([
    edicao ? resumoInscricao(usuarioId, edicao) : null,
    edicao ? resumoMonitoria(usuarioId, edicao) : null,
    resumoSubmissoes(usuarioId, edicao),
    resumoAvaliacoes(usuarioId),
    resumoCertificados(usuarioId),
  ]);

  return {
    edicao: edicao ? { id: edicao.id, nome: edicao.nome, numero: edicao.numero } : null,
    inscricao,
    monitoria,
    submissoes,
    avaliacoes,
    certificados,
  };
}

module.exports = { resumir };
