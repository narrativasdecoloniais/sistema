const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");
const INCLUDE_SUBMISSAO = require("../utils/submissaoIncludePadrao");
const usuariosService = require("./usuarios.service");
const tokenService = require("./token.service");
const emailService = require("./email.service");
const { garantirResultadoNaoDivulgado } = require("./resultadoSubmissoes.service");
const { removerSeNaoAprovada } = require("./apresentacaoSubmissoes.service");

// A distribuição é materializada em AtribuicaoAvaliacao: o vínculo
// avaliador↔área só cria/remove atribuições em eventos pontuais (submissão
// nova, áreas do avaliador alteradas, troca de área aprovada). Assim uma
// atribuição removida manualmente pela organização não volta sozinha.

const SELECT_USUARIO_AVALIADOR = { id: true, nome: true, email: true, cpf: true };

// Conflito de interesse: avaliador nunca recebe automaticamente trabalho do
// qual é autor/coautor — nem pela conta vinculada nem pelo e-mail (coautor
// pode ter sido adicionado antes de ter conta).
function ehAutor(autores, usuario) {
  const email = usuario.email.toLowerCase();
  return autores.some((autor) => autor.usuarioId === usuario.id || autor.email.toLowerCase() === email);
}

async function distribuirSubmissao(db, submissaoId) {
  const submissao = await db.submissao.findUnique({
    where: { id: submissaoId },
    select: {
      id: true,
      edicaoId: true,
      areaSubmissaoId: true,
      autores: { select: { usuarioId: true, email: true } },
    },
  });
  if (!submissao?.areaSubmissaoId) return;

  const avaliadores = await db.avaliadorEdicao.findMany({
    where: { edicaoId: submissao.edicaoId, areas: { some: { id: submissao.areaSubmissaoId } } },
    select: { id: true, usuario: { select: { id: true, email: true } } },
  });

  const dados = avaliadores
    .filter((avaliador) => !ehAutor(submissao.autores, avaliador.usuario))
    .map((avaliador) => ({ submissaoId: submissao.id, avaliadorEdicaoId: avaliador.id, origem: "AREA" }));

  if (dados.length) await db.atribuicaoAvaliacao.createMany({ data: dados, skipDuplicates: true });
}

async function validarAreasDaEdicao(db, edicaoId, areaIds) {
  if (!areaIds.length) return;
  const total = await db.areaSubmissao.count({
    where: { id: { in: areaIds }, modalidadeSubmissao: { edicaoId } },
  });
  if (total !== areaIds.length) throw new ErroHttp(400, "Alguma área selecionada não pertence a esta edição.");
}

async function sincronizarAreasDoAvaliador(db, avaliador, areaIdsNovas) {
  const anteriores = avaliador.areas.map((area) => area.id);
  const adicionadas = areaIdsNovas.filter((id) => !anteriores.includes(id));
  const removidas = anteriores.filter((id) => !areaIdsNovas.includes(id));

  await db.avaliadorEdicao.update({
    where: { id: avaliador.id },
    data: { areas: { set: areaIdsNovas.map((id) => ({ id })) } },
  });

  if (adicionadas.length) {
    const submissoes = await db.submissao.findMany({
      where: { edicaoId: avaliador.edicaoId, areaSubmissaoId: { in: adicionadas } },
      select: { id: true, autores: { select: { usuarioId: true, email: true } } },
    });
    const dados = submissoes
      .filter((submissao) => !ehAutor(submissao.autores, avaliador.usuario))
      .map((submissao) => ({ submissaoId: submissao.id, avaliadorEdicaoId: avaliador.id, origem: "AREA" }));
    if (dados.length) await db.atribuicaoAvaliacao.createMany({ data: dados, skipDuplicates: true });
  }

  // Só as automáticas ainda sem decisão — decisão registrada é histórico e
  // atribuição manual é escolha explícita da organização.
  if (removidas.length) {
    await db.atribuicaoAvaliacao.deleteMany({
      where: {
        avaliadorEdicaoId: avaliador.id,
        origem: "AREA",
        decisao: null,
        submissao: { areaSubmissaoId: { in: removidas } },
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Admin — avaliadores

function formatarAvaliador(avaliador) {
  const total = avaliador.atribuicoes.length;
  const avaliadas = avaliador.atribuicoes.filter((atribuicao) => atribuicao.decisao).length;
  return {
    id: avaliador.id,
    usuario: {
      id: avaliador.usuario.id,
      nome: avaliador.usuario.nome,
      email: avaliador.usuario.email,
    },
    // Conta criada por convite só ganha CPF quando o convite é aceito (ver
    // definirSenha) — mesmo critério de "Convite pendente" da aba Equipe.
    convitePendente: !avaliador.usuario.cpf,
    areas: avaliador.areas,
    totalAtribuidas: total,
    totalAvaliadas: avaliadas,
    totalPendentes: total - avaliadas,
    createdAt: avaliador.createdAt,
  };
}

const INCLUDE_AVALIADOR = {
  usuario: { select: SELECT_USUARIO_AVALIADOR },
  areas: {
    select: { id: true, titulo: true, modalidadeSubmissao: { select: { id: true, nome: true } } },
    orderBy: { ordem: "asc" },
  },
  atribuicoes: { select: { decisao: true } },
};

async function listarAvaliadores(edicaoId) {
  const avaliadores = await prisma.avaliadorEdicao.findMany({
    where: { edicaoId },
    include: INCLUDE_AVALIADOR,
    orderBy: { usuario: { nome: "asc" } },
  });
  return avaliadores.map(formatarAvaliador);
}

async function buscarAvaliadorFormatado(id) {
  const avaliador = await prisma.avaliadorEdicao.findUnique({ where: { id }, include: INCLUDE_AVALIADOR });
  return formatarAvaliador(avaliador);
}

async function adicionarAvaliador(edicaoId, { usuarioId, nome, email, areaIds }) {
  await validarAreasDaEdicao(prisma, edicaoId, areaIds);

  let usuario = null;
  let convidado = false;

  if (usuarioId) {
    usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario || !usuario.ativo || usuario.anonimizadoEm) {
      throw new ErroHttp(404, "Usuário não encontrado.");
    }
  } else {
    usuario = await usuariosService.buscarPorEmail(email);
    if (usuario && (!usuario.ativo || usuario.anonimizadoEm)) {
      throw new ErroHttp(409, "Este e-mail pertence a uma conta desativada.");
    }
    if (!usuario) {
      usuario = await usuariosService.criarUsuarioConvidado({
        nome,
        email,
        papeis: ["PARTICIPANTE", "AVALIADOR"],
      });
      convidado = true;
    }
  }

  const existente = await prisma.avaliadorEdicao.findUnique({
    where: { edicaoId_usuarioId: { edicaoId, usuarioId: usuario.id } },
  });
  if (existente) throw new ErroHttp(409, "Esta pessoa já é avaliadora nesta edição.");

  const avaliadorId = await prisma.$transaction(async (tx) => {
    const criado = await tx.avaliadorEdicao.create({
      data: { edicaoId, usuarioId: usuario.id },
      include: { areas: { select: { id: true } }, usuario: { select: { id: true, email: true } } },
    });
    if (!usuario.papeis.includes("AVALIADOR")) {
      await tx.usuario.update({ where: { id: usuario.id }, data: { papeis: { push: "AVALIADOR" } } });
    }
    await sincronizarAreasDoAvaliador(tx, criado, areaIds);
    return criado.id;
  });

  if (convidado) {
    const token = await tokenService.criarTokenConviteAvaliador(usuario.id);
    await emailService.enviarEmailConviteAvaliador(usuario, token);
  } else {
    await emailService.enviarEmailNotificacaoAvaliador(usuario);
  }

  return buscarAvaliadorFormatado(avaliadorId);
}

async function buscarAvaliadorDaEdicao(db, edicaoId, id) {
  const avaliador = await db.avaliadorEdicao.findUnique({
    where: { id },
    include: { areas: { select: { id: true } }, usuario: { select: { id: true, email: true, papeis: true } } },
  });
  if (!avaliador || avaliador.edicaoId !== edicaoId) throw new ErroHttp(404, "Avaliador não encontrado.");
  return avaliador;
}

async function atualizarAreasAvaliador(edicaoId, id, areaIds) {
  await validarAreasDaEdicao(prisma, edicaoId, areaIds);
  await prisma.$transaction(async (tx) => {
    const avaliador = await buscarAvaliadorDaEdicao(tx, edicaoId, id);
    await sincronizarAreasDoAvaliador(tx, avaliador, areaIds);
  });
  return buscarAvaliadorFormatado(id);
}

async function removerAvaliador(edicaoId, id) {
  const avaliador = await buscarAvaliadorDaEdicao(prisma, edicaoId, id);

  const decisoes = await prisma.atribuicaoAvaliacao.count({
    where: { avaliadorEdicaoId: id, decisao: { not: null } },
  });
  if (decisoes > 0) {
    throw new ErroHttp(
      409,
      "Este avaliador já registrou decisões nesta edição e não pode ser removido. Ajuste as áreas ou remova as atribuições pendentes."
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.avaliadorEdicao.delete({ where: { id } });
    const outrasEdicoes = await tx.avaliadorEdicao.count({ where: { usuarioId: avaliador.usuarioId } });
    if (outrasEdicoes === 0) {
      await tx.usuario.update({
        where: { id: avaliador.usuarioId },
        data: { papeis: avaliador.usuario.papeis.filter((papel) => papel !== "AVALIADOR") },
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Admin — submissões, atribuições e decisão final

async function listarSubmissoes(edicaoId) {
  return prisma.submissao.findMany({
    where: { edicaoId },
    include: {
      ...INCLUDE_SUBMISSAO,
      atribuicoesAvaliacao: {
        include: { avaliadorEdicao: { select: { id: true, usuario: { select: { id: true, nome: true, email: true } } } } },
        orderBy: { createdAt: "asc" },
      },
      sugestoesTrocaArea: {
        where: { status: "PENDENTE" },
        select: { id: true, areaSugerida: { select: { id: true, titulo: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function atribuirManual(edicaoId, { submissaoIds, avaliadorEdicaoId }) {
  await garantirResultadoNaoDivulgado(prisma, edicaoId);
  const avaliador = await prisma.avaliadorEdicao.findUnique({
    where: { id: avaliadorEdicaoId },
    include: { usuario: { select: { id: true, email: true } } },
  });
  if (!avaliador || avaliador.edicaoId !== edicaoId) throw new ErroHttp(404, "Avaliador não encontrado.");

  const submissoes = await prisma.submissao.findMany({
    where: { id: { in: submissaoIds }, edicaoId },
    select: { id: true, autores: { select: { usuarioId: true, email: true } } },
  });
  if (submissoes.length !== submissaoIds.length) throw new ErroHttp(404, "Submissão não encontrada.");

  const semConflito = submissoes.filter((submissao) => !ehAutor(submissao.autores, avaliador.usuario));
  const resultado = await prisma.atribuicaoAvaliacao.createMany({
    data: semConflito.map((submissao) => ({
      submissaoId: submissao.id,
      avaliadorEdicaoId,
      origem: "MANUAL",
    })),
    skipDuplicates: true,
  });

  return {
    criadas: resultado.count,
    ignoradasPorAutoria: submissoes.length - semConflito.length,
    jaAtribuidas: semConflito.length - resultado.count,
  };
}

async function removerAtribuicao(edicaoId, id) {
  await garantirResultadoNaoDivulgado(prisma, edicaoId);
  const atribuicao = await prisma.atribuicaoAvaliacao.findUnique({
    where: { id },
    include: { submissao: { select: { edicaoId: true } } },
  });
  if (!atribuicao || atribuicao.submissao.edicaoId !== edicaoId) {
    throw new ErroHttp(404, "Atribuição não encontrada.");
  }
  await prisma.atribuicaoAvaliacao.delete({ where: { id } });
}

async function definirDecisaoFinal(edicaoId, submissaoId, decisao, usuarioId) {
  await garantirResultadoNaoDivulgado(prisma, edicaoId);
  const submissao = await prisma.submissao.findUnique({ where: { id: submissaoId }, select: { edicaoId: true } });
  if (!submissao || submissao.edicaoId !== edicaoId) throw new ErroHttp(404, "Submissão não encontrada.");

  return prisma.$transaction(async (tx) => {
    // Deixou de ser aprovado → sai da atividade de apresentação.
    await removerSeNaoAprovada(tx, submissaoId, decisao);
    return tx.submissao.update({
      where: { id: submissaoId },
      data: decisao
        ? { decisaoFinal: decisao, decisaoFinalEm: new Date(), decisaoFinalPorId: usuarioId }
        : { decisaoFinal: null, decisaoFinalEm: null, decisaoFinalPorId: null },
      select: { id: true, decisaoFinal: true, decisaoFinalEm: true },
    });
  });
}

// ---------------------------------------------------------------------------
// Admin — sugestões de troca de área

async function listarSugestoes(edicaoId) {
  return prisma.sugestaoTrocaArea.findMany({
    where: { submissao: { edicaoId } },
    include: {
      submissao: { select: { id: true, titulo: true, modalidadeSubmissao: { select: { id: true, nome: true } } } },
      areaAtual: { select: { id: true, titulo: true } },
      areaSugerida: { select: { id: true, titulo: true } },
      avaliadorEdicao: { select: { id: true, usuario: { select: { id: true, nome: true, email: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function resolverSugestao(edicaoId, id, aprovar, usuarioId) {
  await prisma.$transaction(async (tx) => {
    await garantirResultadoNaoDivulgado(tx, edicaoId);
    const sugestao = await tx.sugestaoTrocaArea.findUnique({
      where: { id },
      include: {
        submissao: { select: { id: true, edicaoId: true, modalidadeSubmissaoId: true, decisaoFinal: true } },
        areaSugerida: { select: { modalidadeSubmissaoId: true } },
      },
    });
    if (!sugestao || sugestao.submissao.edicaoId !== edicaoId) {
      throw new ErroHttp(404, "Sugestão não encontrada.");
    }
    if (sugestao.status !== "PENDENTE") throw new ErroHttp(409, "Esta sugestão já foi resolvida.");

    const agora = new Date();
    const resolucao = { resolvidoPorId: usuarioId, resolvidoEm: agora };

    if (!aprovar) {
      await tx.sugestaoTrocaArea.update({ where: { id }, data: { status: "RECUSADA", ...resolucao } });
      return;
    }

    if (sugestao.submissao.decisaoFinal) {
      throw new ErroHttp(409, "A submissão já tem decisão final — limpe a decisão antes de trocar a área.");
    }
    if (sugestao.areaSugerida.modalidadeSubmissaoId !== sugestao.submissao.modalidadeSubmissaoId) {
      throw new ErroHttp(409, "A área sugerida não pertence mais à modalidade desta submissão.");
    }

    await tx.sugestaoTrocaArea.update({ where: { id }, data: { status: "APROVADA", ...resolucao } });
    // As demais sugestões pendentes perdem o sentido com a troca aprovada.
    await tx.sugestaoTrocaArea.updateMany({
      where: { submissaoId: sugestao.submissaoId, status: "PENDENTE" },
      data: { status: "RECUSADA", ...resolucao },
    });
    await tx.submissao.update({
      where: { id: sugestao.submissaoId },
      data: { areaSubmissaoId: sugestao.areaSugeridaId },
    });
    // Redistribuição do zero: as atribuições (e decisões) da área antiga não
    // valem para a nova.
    await tx.atribuicaoAvaliacao.deleteMany({ where: { submissaoId: sugestao.submissaoId } });
    await distribuirSubmissao(tx, sugestao.submissaoId);
  });
}

// ---------------------------------------------------------------------------
// Avaliador (área do participante) — projeção cega, nunca expõe autores.

function statusAtribuicao(atribuicao, sugestaoPendente) {
  if (atribuicao.submissao.decisaoFinal) return "ENCERRADA";
  if (sugestaoPendente) return "TROCA_SUGERIDA";
  if (atribuicao.decisao) return "AVALIADA";
  return "PENDENTE";
}

function formatarAtribuicaoCega(atribuicao, { completa = false } = {}) {
  const { submissao } = atribuicao;
  const sugestaoPendente = submissao.sugestoesTrocaArea.find((sugestao) => sugestao.status === "PENDENTE") || null;
  return {
    id: atribuicao.id,
    decisao: atribuicao.decisao,
    decididoEm: atribuicao.decididoEm,
    status: statusAtribuicao(atribuicao, sugestaoPendente),
    sugestaoPendente: sugestaoPendente
      ? { id: sugestaoPendente.id, areaSugerida: sugestaoPendente.areaSugerida, justificativa: sugestaoPendente.justificativa }
      : null,
    submissao: {
      id: submissao.id,
      titulo: submissao.titulo,
      edicao: submissao.edicao,
      modalidade: submissao.modalidadeSubmissao,
      area: submissao.areaSubmissao,
      ...(completa
        ? {
            resumo: submissao.resumo,
            referenciaBibliografica: submissao.referenciaBibliografica,
            areasDaModalidade: submissao.modalidadeSubmissao.areas,
          }
        : {}),
    },
    createdAt: atribuicao.createdAt,
  };
}

function includeCego(usuarioId, { completa = false } = {}) {
  return {
    submissao: {
      select: {
        id: true,
        titulo: true,
        decisaoFinal: true,
        resumo: completa,
        referenciaBibliografica: completa,
        edicao: { select: { id: true, numero: true, nome: true } },
        modalidadeSubmissao: {
          select: {
            id: true,
            nome: true,
            ...(completa
              ? { areas: { select: { id: true, titulo: true }, orderBy: { ordem: "asc" } } }
              : {}),
          },
        },
        areaSubmissao: { select: { id: true, titulo: true } },
        sugestoesTrocaArea: {
          where: { avaliadorEdicao: { usuarioId } },
          select: {
            id: true,
            status: true,
            justificativa: true,
            areaSugerida: { select: { id: true, titulo: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    },
  };
}

async function listarMinhasAtribuicoes(usuarioId) {
  const atribuicoes = await prisma.atribuicaoAvaliacao.findMany({
    where: { avaliadorEdicao: { usuarioId } },
    include: includeCego(usuarioId),
    orderBy: { createdAt: "desc" },
  });
  return atribuicoes.map((atribuicao) => formatarAtribuicaoCega(atribuicao));
}

async function carregarMinhaAtribuicao(id, usuarioId) {
  const atribuicao = await prisma.atribuicaoAvaliacao.findUnique({
    where: { id },
    include: { ...includeCego(usuarioId, { completa: true }), avaliadorEdicao: { select: { usuarioId: true } } },
  });
  if (!atribuicao || atribuicao.avaliadorEdicao.usuarioId !== usuarioId) {
    throw new ErroHttp(404, "Avaliação não encontrada.");
  }
  return atribuicao;
}

async function buscarMinhaAtribuicao(id, usuarioId) {
  return formatarAtribuicaoCega(await carregarMinhaAtribuicao(id, usuarioId), { completa: true });
}

async function registrarDecisao(id, usuarioId, decisao) {
  const atribuicao = await carregarMinhaAtribuicao(id, usuarioId);
  await garantirResultadoNaoDivulgado(prisma, atribuicao.submissao.edicao.id);
  if (atribuicao.submissao.decisaoFinal) {
    throw new ErroHttp(409, "A organização já encerrou a avaliação deste trabalho.");
  }
  if (atribuicao.submissao.sugestoesTrocaArea.some((sugestao) => sugestao.status === "PENDENTE")) {
    throw new ErroHttp(409, "Você sugeriu a troca de área deste trabalho — aguarde a resposta da organização.");
  }

  await prisma.atribuicaoAvaliacao.update({
    where: { id },
    data: { decisao, decididoEm: new Date() },
  });
  return buscarMinhaAtribuicao(id, usuarioId);
}

async function sugerirArea(id, usuarioId, { areaSugeridaId, justificativa }) {
  const atribuicao = await carregarMinhaAtribuicao(id, usuarioId);
  const { submissao } = atribuicao;
  await garantirResultadoNaoDivulgado(prisma, submissao.edicao.id);

  if (submissao.decisaoFinal) throw new ErroHttp(409, "A organização já encerrou a avaliação deste trabalho.");
  if (atribuicao.decisao) {
    throw new ErroHttp(409, "Você já registrou uma decisão para este trabalho.");
  }
  if (submissao.sugestoesTrocaArea.some((sugestao) => sugestao.status === "PENDENTE")) {
    throw new ErroHttp(409, "Você já tem uma sugestão de troca pendente para este trabalho.");
  }
  if (!submissao.modalidadeSubmissao.areas.some((area) => area.id === areaSugeridaId)) {
    throw new ErroHttp(400, "Selecione uma área desta modalidade.");
  }
  if (submissao.areaSubmissao?.id === areaSugeridaId) {
    throw new ErroHttp(400, "Selecione uma área diferente da atual.");
  }

  await prisma.sugestaoTrocaArea.create({
    data: {
      submissaoId: submissao.id,
      avaliadorEdicaoId: atribuicao.avaliadorEdicaoId,
      areaAtualId: submissao.areaSubmissao?.id || null,
      areaSugeridaId,
      justificativa: justificativa || null,
    },
  });
  return buscarMinhaAtribuicao(id, usuarioId);
}

module.exports = {
  distribuirSubmissao,
  listarAvaliadores,
  adicionarAvaliador,
  atualizarAreasAvaliador,
  removerAvaliador,
  listarSubmissoes,
  atribuirManual,
  removerAtribuicao,
  definirDecisaoFinal,
  listarSugestoes,
  resolverSugestao,
  listarMinhasAtribuicoes,
  buscarMinhaAtribuicao,
  registrarDecisao,
  sugerirArea,
};
