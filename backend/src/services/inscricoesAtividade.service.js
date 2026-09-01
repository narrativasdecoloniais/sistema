const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");
const inscricoesService = require("./inscricoes.service");

const CAMPOS_USUARIO = {
  id: true,
  nome: true,
  email: true,
  cpf: true,
};

const INCLUDE_PADRAO = {
  usuario: { select: CAMPOS_USUARIO },
  atividade: { select: { id: true, nome: true, edicaoId: true } },
};

async function listarPorEdicao(edicaoId, { atividadeId } = {}) {
  return prisma.inscricaoAtividade.findMany({
    where: {
      atividade: { edicaoId },
      ...(atividadeId ? { atividadeId } : {}),
    },
    include: INCLUDE_PADRAO,
    orderBy: { createdAt: "asc" },
  });
}

async function buscarPorId(id) {
  return prisma.inscricaoAtividade.findUnique({ where: { id }, include: INCLUDE_PADRAO });
}

async function criar({ usuarioId, atividadeId, status }) {
  const atividade = await prisma.atividade.findUnique({ where: { id: atividadeId } });
  if (!atividade) throw new ErroHttp(404, "Atividade não encontrada.");
  if (!atividade.exigeInscricao) {
    throw new ErroHttp(409, "Esta atividade não exige inscrição.");
  }

  const jaExiste = await prisma.inscricaoAtividade.findUnique({
    where: { usuarioId_atividadeId: { usuarioId, atividadeId } },
  });
  if (jaExiste) throw new ErroHttp(409, "Esta pessoa já está inscrita nesta atividade.");

  const [, inscricaoAtividade] = await prisma.$transaction([
    prisma.inscricaoEdicao.upsert({
      where: { usuarioId_edicaoId: { usuarioId, edicaoId: atividade.edicaoId } },
      update: {},
      create: { usuarioId, edicaoId: atividade.edicaoId },
    }),
    prisma.inscricaoAtividade.create({
      data: { usuarioId, atividadeId, status },
      include: INCLUDE_PADRAO,
    }),
  ]);

  return inscricaoAtividade;
}

async function atualizarStatus(id, status) {
  return prisma.inscricaoAtividade.update({
    where: { id },
    data: { status },
    include: INCLUDE_PADRAO,
  });
}

// Promove automaticamente o próximo da lista de espera, mesmo comportamento
// do cancelamento self-service — ver promoverAoCancelar em inscricoes.service.js.
async function excluir(id) {
  await inscricoesService.cancelarInscricaoAtividadeComPromocao(id);
}

module.exports = { listarPorEdicao, buscarPorId, criar, atualizarStatus, excluir };
