const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");

async function listarTiposComissao() {
  return prisma.tipoComissao.findMany({ orderBy: { nome: "asc" } });
}

async function buscarPorId(id) {
  return prisma.tipoComissao.findUnique({ where: { id } });
}

async function criarTipoComissao(dados) {
  return prisma.tipoComissao.create({ data: dados });
}

async function atualizarTipoComissao(id, dados) {
  return prisma.tipoComissao.update({ where: { id }, data: dados });
}

async function excluirTipoComissao(id) {
  const emUso = await prisma.comissao.count({ where: { tipoComissaoId: id } });
  if (emUso > 0) {
    throw new ErroHttp(409, "Este tipo de comissão está em uso e não pode ser excluído.");
  }
  await prisma.tipoComissao.delete({ where: { id } });
}

module.exports = {
  listarTiposComissao,
  buscarPorId,
  criarTipoComissao,
  atualizarTipoComissao,
  excluirTipoComissao,
};
