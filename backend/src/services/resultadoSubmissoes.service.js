const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");
const INCLUDE_SUBMISSAO = require("../utils/submissaoIncludePadrao");
const { prazoCorrecaoAberto, formatarPrazoCorrecao } = require("../utils/prazoCorrecao");
const emailService = require("./email.service");
const emailResultadoService = require("./emailResultado.service");

// Decisões que pedem ação do autor principal depois da divulgação.
const DECISOES_COM_CORRECAO = ["APROVADO_COM_RESSALVAS", "APROVADO_FORMATACAO"];

// Resend aceita 2 req/s por padrão — envio sequencial com folga.
const INTERVALO_ENVIO_MS = 600;

// Um envio em andamento por edição (processo único no Railway). Se o
// servidor reiniciar no meio, "Reenviar pendentes" retoma de onde parou,
// já que só as submissões sem emailResultadoEnviadoEm são processadas.
const enviosEmAndamento = new Set();

function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

async function buscarEdicao(db, edicaoId) {
  const edicao = await db.edicao.findUnique({
    where: { id: edicaoId },
    select: { id: true, nome: true, resultadoDivulgadoEm: true, prazoCorrecaoSubmissao: true },
  });
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
  return edicao;
}

// Usado também pela avaliação: depois da divulgação as decisões ficam
// travadas, já que os e-mails de resultado já saíram.
async function garantirResultadoNaoDivulgado(db, edicaoId) {
  const edicao = await buscarEdicao(db, edicaoId);
  if (edicao.resultadoDivulgadoEm) {
    throw new ErroHttp(409, "O resultado desta edição já foi divulgado — as decisões não podem mais ser alteradas.");
  }
  return edicao;
}

async function resumo(edicaoId) {
  const edicao = await buscarEdicao(prisma, edicaoId);
  const [porDecisao, porCorrecao, emailsEnviados, emailsComErro, total] = await Promise.all([
    prisma.submissao.groupBy({ by: ["decisaoFinal"], where: { edicaoId }, _count: { _all: true } }),
    prisma.submissao.groupBy({
      by: ["statusCorrecao"],
      where: { edicaoId, statusCorrecao: { not: null } },
      _count: { _all: true },
    }),
    prisma.submissao.count({ where: { edicaoId, emailResultadoEnviadoEm: { not: null } } }),
    prisma.submissao.count({
      where: { edicaoId, emailResultadoEnviadoEm: null, emailResultadoErro: { not: null } },
    }),
    prisma.submissao.count({ where: { edicaoId } }),
  ]);

  const decisoes = Object.fromEntries(porDecisao.map((item) => [item.decisaoFinal || "SEM_DECISAO", item._count._all]));
  const correcoes = Object.fromEntries(porCorrecao.map((item) => [item.statusCorrecao, item._count._all]));
  const comCorrecao = DECISOES_COM_CORRECAO.reduce((soma, decisao) => soma + (decisoes[decisao] || 0), 0);

  return {
    total,
    decisoes,
    semDecisao: decisoes.SEM_DECISAO || 0,
    comCorrecao,
    correcoes,
    prazoCorrecao: edicao.prazoCorrecaoSubmissao,
    prazoCorrecaoAberto: prazoCorrecaoAberto(edicao.prazoCorrecaoSubmissao),
    divulgadoEm: edicao.resultadoDivulgadoEm,
    emails: {
      total: edicao.resultadoDivulgadoEm ? total : 0,
      enviados: emailsEnviados,
      comErro: emailsComErro,
      pendentes: edicao.resultadoDivulgadoEm ? total - emailsEnviados : 0,
      enviando: enviosEmAndamento.has(edicaoId),
    },
  };
}

async function listarTrabalhos(edicaoId) {
  await buscarEdicao(prisma, edicaoId);
  return prisma.submissao.findMany({
    where: { edicaoId },
    include: {
      ...INCLUDE_SUBMISSAO,
      // Versão imediatamente anterior à correção atual, para comparar.
      versoes: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { titulo: "asc" },
  });
}

async function buscarSubmissaoDaEdicao(db, edicaoId, id) {
  const submissao = await db.submissao.findUnique({ where: { id } });
  if (!submissao || submissao.edicaoId !== edicaoId) throw new ErroHttp(404, "Submissão não encontrada.");
  return submissao;
}

async function atualizarObservacao(edicaoId, id, observacao) {
  await garantirResultadoNaoDivulgado(prisma, edicaoId);
  await buscarSubmissaoDaEdicao(prisma, edicaoId, id);
  return prisma.submissao.update({
    where: { id },
    data: { observacaoResultado: observacao || null },
    select: { id: true, observacaoResultado: true },
  });
}

// Pode ser alterado mesmo depois da divulgação (ex.: estender o prazo).
async function definirPrazo(edicaoId, prazo) {
  await buscarEdicao(prisma, edicaoId);
  const edicao = await prisma.edicao.update({
    where: { id: edicaoId },
    data: { prazoCorrecaoSubmissao: prazo },
    select: { prazoCorrecaoSubmissao: true },
  });
  return edicao.prazoCorrecaoSubmissao;
}

async function divulgar(edicaoId) {
  await prisma.$transaction(async (tx) => {
    const edicao = await garantirResultadoNaoDivulgado(tx, edicaoId);

    const [total, semDecisao, comCorrecao] = await Promise.all([
      tx.submissao.count({ where: { edicaoId } }),
      tx.submissao.count({ where: { edicaoId, decisaoFinal: null } }),
      tx.submissao.count({ where: { edicaoId, decisaoFinal: { in: DECISOES_COM_CORRECAO } } }),
    ]);

    if (total === 0) throw new ErroHttp(409, "Não há trabalhos submetidos nesta edição.");
    if (semDecisao > 0) {
      throw new ErroHttp(
        409,
        `Ainda há ${semDecisao} ${semDecisao === 1 ? "trabalho" : "trabalhos"} sem decisão final. Registre todas as decisões na Avaliação antes de divulgar.`
      );
    }
    if (comCorrecao > 0 && !prazoCorrecaoAberto(edicao.prazoCorrecaoSubmissao)) {
      throw new ErroHttp(409, "Defina um prazo de correção futuro antes de divulgar — há trabalhos que exigem correção.");
    }

    await tx.edicao.update({ where: { id: edicaoId }, data: { resultadoDivulgadoEm: new Date() } });
    await tx.submissao.updateMany({
      where: { edicaoId, decisaoFinal: { in: DECISOES_COM_CORRECAO } },
      data: { statusCorrecao: "PENDENTE" },
    });
  });

  iniciarEnvioEmSegundoPlano(edicaoId);
}

function iniciarEnvioEmSegundoPlano(edicaoId) {
  enviarEmailsPendentes(edicaoId).catch((erro) => {
    console.error(`[resultado] Falha no envio de e-mails da edição ${edicaoId}:`, erro);
  });
}

async function reenviarPendentes(edicaoId) {
  const edicao = await buscarEdicao(prisma, edicaoId);
  if (!edicao.resultadoDivulgadoEm) throw new ErroHttp(409, "O resultado ainda não foi divulgado.");
  if (enviosEmAndamento.has(edicaoId)) throw new ErroHttp(409, "O envio dos e-mails já está em andamento.");
  iniciarEnvioEmSegundoPlano(edicaoId);
}

// Envia um e-mail por autor (principal e coautores) de cada submissão ainda
// sem emailResultadoEnviadoEm. Falha num autor marca a submissão com erro e
// segue para a próxima — no reenvio, a submissão inteira é reprocessada.
async function enviarEmailsPendentes(edicaoId) {
  if (enviosEmAndamento.has(edicaoId)) return;
  enviosEmAndamento.add(edicaoId);

  try {
    const edicao = await buscarEdicao(prisma, edicaoId);
    if (!edicao.resultadoDivulgadoEm) return;

    const modelos = await emailResultadoService.listarModelos(edicaoId);
    const submissoes = await prisma.submissao.findMany({
      where: { edicaoId, emailResultadoEnviadoEm: null, decisaoFinal: { not: null } },
      include: INCLUDE_SUBMISSAO,
      orderBy: { createdAt: "asc" },
    });

    for (const submissao of submissoes) {
      const modelo = modelos.find((item) => item.decisao === submissao.decisaoFinal);
      try {
        for (const autor of submissao.autores) {
          const { assunto, html } = emailResultadoService.renderizar(modelo, {
            nome: autor.nome,
            titulo: submissao.titulo,
            modalidade: submissao.modalidadeSubmissao.nome,
            area: submissao.areaSubmissao?.titulo || "—",
            edicao: edicao.nome,
            observacao: submissao.observacaoResultado || "",
            prazo: formatarPrazoCorrecao(edicao.prazoCorrecaoSubmissao),
          });
          await emailService.enviarEmail({ para: autor.email, assunto, html });
          await esperar(INTERVALO_ENVIO_MS);
        }
        await prisma.submissao.update({
          where: { id: submissao.id },
          data: { emailResultadoEnviadoEm: new Date(), emailResultadoErro: null },
        });
      } catch (erro) {
        console.error(`[resultado] E-mail da submissão ${submissao.id} falhou:`, erro.message);
        await prisma.submissao.update({
          where: { id: submissao.id },
          data: { emailResultadoErro: String(erro.message).slice(0, 500) },
        });
      }
    }
  } finally {
    enviosEmAndamento.delete(edicaoId);
  }
}

async function conferirCorrecao(edicaoId, id, { aceitar, motivo }) {
  const edicao = await buscarEdicao(prisma, edicaoId);
  const submissao = await buscarSubmissaoDaEdicao(prisma, edicaoId, id);

  if (submissao.decisaoFinal !== "APROVADO_COM_RESSALVAS" || submissao.statusCorrecao !== "ENVIADA") {
    throw new ErroHttp(409, "Não há correção aguardando conferência neste trabalho.");
  }

  const atualizada = await prisma.submissao.update({
    where: { id },
    data: aceitar
      ? { statusCorrecao: "CONCLUIDA", motivoDevolucao: null }
      : { statusCorrecao: "DEVOLVIDA", motivoDevolucao: motivo },
    select: { id: true, statusCorrecao: true, motivoDevolucao: true, usuario: { select: { nome: true, email: true } } },
  });

  if (!aceitar) {
    try {
      await emailService.enviarEmailCorrecaoDevolvida(atualizada.usuario, {
        edicao,
        titulo: submissao.titulo,
        motivo,
        prazo: prazoCorrecaoAberto(edicao.prazoCorrecaoSubmissao)
          ? formatarPrazoCorrecao(edicao.prazoCorrecaoSubmissao)
          : "",
      });
    } catch (erro) {
      console.error(`[resultado] Falha ao avisar devolução da submissão ${id}:`, erro.message);
    }
  }

  return { id: atualizada.id, statusCorrecao: atualizada.statusCorrecao, motivoDevolucao: atualizada.motivoDevolucao };
}

module.exports = {
  DECISOES_COM_CORRECAO,
  garantirResultadoNaoDivulgado,
  resumo,
  listarTrabalhos,
  atualizarObservacao,
  definirPrazo,
  divulgar,
  reenviarPendentes,
  enviarEmailsPendentes,
  conferirCorrecao,
};
