const prisma = require("../config/prisma");
const INCLUDE_PADRAO = require("../utils/submissaoIncludePadrao");

async function listarPorEdicao(edicaoId, { modalidadeSubmissaoId, areaSubmissaoId } = {}) {
  return prisma.submissao.findMany({
    where: {
      edicaoId,
      ...(modalidadeSubmissaoId ? { modalidadeSubmissaoId } : {}),
      ...(areaSubmissaoId ? { areaSubmissaoId } : {}),
    },
    include: INCLUDE_PADRAO,
    orderBy: { createdAt: "desc" },
  });
}

async function buscarPorId(id) {
  return prisma.submissao.findUnique({ where: { id }, include: INCLUDE_PADRAO });
}

async function excluir(id) {
  await prisma.submissao.delete({ where: { id } });
}

module.exports = { listarPorEdicao, buscarPorId, excluir };
