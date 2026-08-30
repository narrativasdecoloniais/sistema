const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");

async function listarTiposPontoInteresse() {
  return prisma.tipoPontoInteresse.findMany({ orderBy: { nome: "asc" } });
}

async function buscarPorId(id) {
  return prisma.tipoPontoInteresse.findUnique({ where: { id } });
}

async function criarTipoPontoInteresse(dados) {
  return prisma.tipoPontoInteresse.create({ data: dados });
}

async function atualizarTipoPontoInteresse(id, dados) {
  return prisma.tipoPontoInteresse.update({ where: { id }, data: dados });
}

async function excluirTipoPontoInteresse(id) {
  const emUso = await prisma.edicaoPontoInteresse.count({ where: { tipoId: id } });
  if (emUso > 0) {
    throw new ErroHttp(409, "Este tipo de ponto de referência está em uso e não pode ser excluído.");
  }
  await prisma.tipoPontoInteresse.delete({ where: { id } });
}

module.exports = {
  listarTiposPontoInteresse,
  buscarPorId,
  criarTipoPontoInteresse,
  atualizarTipoPontoInteresse,
  excluirTipoPontoInteresse,
};
