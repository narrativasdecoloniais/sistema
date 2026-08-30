const prisma = require("../config/prisma");
const sincronizarLista = require("../utils/sincronizarLista");

const INCLUDE_PADRAO = {
  tipoComissao: true,
  membros: { orderBy: { ordem: "asc" } },
};

// `indice` reflete a posição do integrante no array recebido do admin (já
// na ordem final, definida pelo gestor) — nunca um valor de ordem vindo do
// cliente, pra não confiar em algo que o front poderia forjar.
function camposMembro(membro, indice) {
  return { nome: membro.nome, ordem: indice };
}

async function listarComissoes(edicaoId) {
  return prisma.comissao.findMany({
    where: { edicaoId },
    include: INCLUDE_PADRAO,
    orderBy: { ordem: "asc" },
  });
}

async function buscarPorId(edicaoId, id) {
  return prisma.comissao.findFirst({
    where: { id, edicaoId },
    include: INCLUDE_PADRAO,
  });
}

async function criarComissao(edicaoId, dados) {
  const { membros, ...camposComissao } = dados;
  const membrosCriados = membros && membros.length > 0 ? membros.map(camposMembro) : undefined;

  return prisma.comissao.create({
    data: {
      ...camposComissao,
      edicaoId,
      membros: membrosCriados ? { create: membrosCriados } : undefined,
    },
    include: INCLUDE_PADRAO,
  });
}

async function atualizarComissao(id, dados) {
  const { membros, ...camposComissao } = dados;

  const operacoes = membros
    ? await sincronizarLista(prisma.comissaoMembro, "comissaoId", id, membros, camposMembro)
    : [];

  if (operacoes.length > 0) {
    await prisma.$transaction(operacoes);
  }

  return prisma.comissao.update({
    where: { id },
    data: camposComissao,
    include: INCLUDE_PADRAO,
  });
}

async function excluirComissao(id) {
  await prisma.comissao.delete({ where: { id } });
}

module.exports = {
  listarComissoes,
  buscarPorId,
  criarComissao,
  atualizarComissao,
  excluirComissao,
};
