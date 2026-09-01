const prisma = require("../config/prisma");
const sincronizarLista = require("../utils/sincronizarLista");
const ErroHttp = require("../utils/erroHttp");

const INCLUDE_PADRAO = {
  areas: {
    orderBy: { ordem: "asc" },
    include: {
      atividades: {
        select: {
          id: true,
          nome: true,
          slug: true,
          local: true,
          inicioAtividade: true,
          fimAtividade: true,
          tipoAtividade: { select: { nome: true } },
        },
        orderBy: { inicioAtividade: "asc" },
      },
    },
  },
};

function camposArea(area, indice) {
  return {
    slug: area.slug,
    titulo: area.titulo,
    descricao: area.descricao ?? null,
    ordem: indice,
  };
}

// Roda antes do deleteMany de sincronizarLista, pra área removida do payload
// — se ainda tiver atividade vinculada, aborta a exclusão inteira antes de
// qualquer mutação rodar (mesmo contrato de aoRemover usado em
// atividades.service.js, mas aqui pra bloquear em vez de limpar imagem).
async function guardarRemocaoArea(area) {
  const emUso = await prisma.atividade.count({ where: { areaSubmissaoId: area.id } });
  if (emUso > 0) {
    throw new ErroHttp(409, "Esta área temática está vinculada a atividades e não pode ser excluída.");
  }
}

// Atividade não é filha da área (já existe, criada em Programação) — o
// vínculo é só o FK Atividade.areaSubmissaoId, então sincroniza por fora do
// nested write de área: busca as áreas já persistidas (id real, inclusive
// das recém-criadas) e casa com o payload pelo slug, único por modalidade.
async function sincronizarAtividadesDasAreas(modalidadeSubmissaoId, edicaoId, areasPayload = []) {
  const areasDb = await prisma.areaSubmissao.findMany({
    where: { modalidadeSubmissaoId },
    select: { id: true, slug: true },
  });

  for (const areaPayload of areasPayload) {
    const areaDb = areasDb.find((item) => item.slug === areaPayload.slug);
    if (!areaDb) continue;

    const atividadeIds = areaPayload.atividadeIds || [];
    await prisma.atividade.updateMany({
      where: { areaSubmissaoId: areaDb.id, id: { notIn: atividadeIds } },
      data: { areaSubmissaoId: null },
    });
    if (atividadeIds.length > 0) {
      await prisma.atividade.updateMany({
        where: { id: { in: atividadeIds }, edicaoId },
        data: { areaSubmissaoId: areaDb.id },
      });
    }
  }
}

async function listarModalidades(edicaoId) {
  return prisma.modalidadeSubmissao.findMany({
    where: { edicaoId },
    include: INCLUDE_PADRAO,
    orderBy: { ordem: "asc" },
  });
}

async function buscarPorId(edicaoId, id) {
  return prisma.modalidadeSubmissao.findFirst({
    where: { id, edicaoId },
    include: INCLUDE_PADRAO,
  });
}

async function buscarPorSlug(edicaoId, slug) {
  return prisma.modalidadeSubmissao.findFirst({
    where: { edicaoId, slug },
    include: INCLUDE_PADRAO,
  });
}

async function criarModalidade(edicaoId, dados) {
  const { areas, ...camposModalidade } = dados;
  const areasCriadas =
    areas && areas.length > 0 ? areas.map((area, indice) => camposArea(area, indice)) : undefined;

  const modalidade = await prisma.modalidadeSubmissao.create({
    data: {
      ...camposModalidade,
      edicaoId,
      areas: areasCriadas ? { create: areasCriadas } : undefined,
    },
    include: INCLUDE_PADRAO,
  });

  if (areas && areas.length > 0) {
    await sincronizarAtividadesDasAreas(modalidade.id, edicaoId, areas);
    return buscarPorId(edicaoId, modalidade.id);
  }

  return modalidade;
}

async function atualizarModalidade(id, dados) {
  const { areas, ...camposModalidade } = dados;

  const operacoes = areas
    ? await sincronizarLista(
        prisma.areaSubmissao,
        "modalidadeSubmissaoId",
        id,
        areas,
        camposArea,
        guardarRemocaoArea
      )
    : [];

  if (operacoes.length > 0) {
    await prisma.$transaction(operacoes);
  }

  if (areas) {
    const modalidadeAtual = await prisma.modalidadeSubmissao.findUnique({
      where: { id },
      select: { edicaoId: true },
    });
    await sincronizarAtividadesDasAreas(id, modalidadeAtual.edicaoId, areas);
  }

  return prisma.modalidadeSubmissao.update({
    where: { id },
    data: camposModalidade,
    include: INCLUDE_PADRAO,
  });
}

async function excluirModalidade(id) {
  const emUso = await prisma.atividade.count({ where: { areaSubmissao: { modalidadeSubmissaoId: id } } });
  if (emUso > 0) {
    throw new ErroHttp(409, "Esta modalidade possui áreas vinculadas a atividades e não pode ser excluída.");
  }
  await prisma.modalidadeSubmissao.delete({ where: { id } });
}

module.exports = {
  listarModalidades,
  buscarPorId,
  buscarPorSlug,
  criarModalidade,
  atualizarModalidade,
  excluirModalidade,
};
