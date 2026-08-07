const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");

async function listarTiposAtividade() {
  return prisma.tipoAtividade.findMany({ orderBy: { nome: "asc" } });
}

async function buscarPorId(id) {
  return prisma.tipoAtividade.findUnique({ where: { id } });
}

async function criarTipoAtividade(dados) {
  return prisma.tipoAtividade.create({ data: dados });
}

async function atualizarTipoAtividade(id, dados) {
  return prisma.tipoAtividade.update({ where: { id }, data: dados });
}

async function excluirTipoAtividade(id) {
  const emUso = await prisma.atividade.count({ where: { tipoAtividadeId: id } });
  if (emUso > 0) {
    throw new ErroHttp(409, "Este tipo de atividade está em uso e não pode ser excluído.");
  }
  await prisma.tipoAtividade.delete({ where: { id } });
}

module.exports = {
  listarTiposAtividade,
  buscarPorId,
  criarTipoAtividade,
  atualizarTipoAtividade,
  excluirTipoAtividade,
};
