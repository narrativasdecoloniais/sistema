const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");

const CAMPOS_USUARIO = {
  id: true,
  nome: true,
  email: true,
  cpf: true,
  instituicao: true,
};

async function listarPorEdicao(edicaoId) {
  return prisma.inscricaoEdicao.findMany({
    where: { edicaoId },
    include: { usuario: { select: CAMPOS_USUARIO } },
    orderBy: { createdAt: "asc" },
  });
}

async function buscarPorId(id) {
  return prisma.inscricaoEdicao.findUnique({
    where: { id },
    include: { usuario: { select: CAMPOS_USUARIO } },
  });
}

async function criar(edicaoId, usuarioId) {
  const jaExiste = await prisma.inscricaoEdicao.findUnique({
    where: { usuarioId_edicaoId: { usuarioId, edicaoId } },
  });
  if (jaExiste) throw new ErroHttp(409, "Esta pessoa já está inscrita nesta edição.");

  return prisma.inscricaoEdicao.create({
    data: { usuarioId, edicaoId },
    include: { usuario: { select: CAMPOS_USUARIO } },
  });
}

async function excluir(id) {
  const inscricao = await prisma.inscricaoEdicao.findUnique({ where: { id } });
  if (!inscricao) throw new ErroHttp(404, "Inscrição não encontrada.");

  await prisma.$transaction([
    prisma.inscricaoAtividade.deleteMany({
      where: {
        usuarioId: inscricao.usuarioId,
        atividade: { edicaoId: inscricao.edicaoId },
      },
    }),
    prisma.inscricaoEdicao.delete({ where: { id } }),
  ]);
}

module.exports = { listarPorEdicao, buscarPorId, criar, excluir };
