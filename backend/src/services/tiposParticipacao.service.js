const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");

async function listarTiposParticipacao() {
  // Tipos com ordem definida primeiro (na ordem escolhida), os demais em
  // seguida por nome — mesma lógica de quem aparece antes nas páginas públicas.
  return prisma.tipoParticipacao.findMany({
    orderBy: [{ ordem: { sort: "asc", nulls: "last" } }, { nome: "asc" }],
  });
}

async function buscarPorId(id) {
  return prisma.tipoParticipacao.findUnique({ where: { id } });
}

async function criarTipoParticipacao(dados) {
  return prisma.tipoParticipacao.create({ data: dados });
}

async function atualizarTipoParticipacao(id, dados) {
  return prisma.tipoParticipacao.update({ where: { id }, data: dados });
}

async function excluirTipoParticipacao(id) {
  const emUso = await prisma.atividadePessoa.count({ where: { tipoParticipacaoId: id } });
  if (emUso > 0) {
    throw new ErroHttp(409, "Este tipo de participação está em uso e não pode ser excluído.");
  }
  await prisma.tipoParticipacao.delete({ where: { id } });
}

module.exports = {
  listarTiposParticipacao,
  buscarPorId,
  criarTipoParticipacao,
  atualizarTipoParticipacao,
  excluirTipoParticipacao,
};
