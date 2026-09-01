const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");
const inscricoesAbertas = require("../utils/inscricoesAbertas");
const edicoesService = require("./edicoes.service");
const inscricoesService = require("./inscricoes.service");

// Composição self-service sobre a engine edição-agnóstica de
// inscricoes.service.js — mesma lógica de conflito de horário e vagas/lista
// de espera do fluxo público, só que autenticada por cookie (sem token
// intermediário) e com o gate extra de "a edição aceita inscrições agora".
async function listarParaUsuario(usuarioId) {
  const [edicoesAbertasAgora, inscricoesDoUsuario] = await Promise.all([
    edicoesService.listarEdicoesComInscricoesAbertas(),
    prisma.inscricaoEdicao.findMany({ where: { usuarioId }, include: { edicao: true } }),
  ]);

  const porEdicaoId = new Map();
  for (const edicao of edicoesAbertasAgora) {
    porEdicaoId.set(edicao.id, { edicao, aberta: true, jaInscrito: false });
  }
  for (const inscricao of inscricoesDoUsuario) {
    const existente = porEdicaoId.get(inscricao.edicaoId);
    if (existente) {
      existente.jaInscrito = true;
    } else {
      porEdicaoId.set(inscricao.edicaoId, { edicao: inscricao.edicao, aberta: false, jaInscrito: true });
    }
  }

  return Array.from(porEdicaoId.values()).sort((a, b) => b.edicao.numero - a.edicao.numero);
}

async function buscarPorId(id) {
  const edicao = await edicoesService.buscarPorId(id);
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
  return edicao;
}

async function buscarEstado(usuarioId, edicaoId) {
  const edicao = await buscarPorId(edicaoId);
  const estado = await inscricoesService.buscarEstadoInscricao(edicaoId, usuarioId);
  return { edicao, aberta: inscricoesAbertas(edicao), ...estado };
}

function exigirAberta(edicao) {
  if (!inscricoesAbertas(edicao)) {
    throw new ErroHttp(409, "As inscrições desta edição não estão abertas.");
  }
}

async function inscreverOuAtualizar(usuarioId, edicaoId, atividadeIds) {
  const edicao = await buscarPorId(edicaoId);
  exigirAberta(edicao);
  return inscricoesService.finalizarInscricao({ usuarioId, edicaoId, atividadeIds });
}

async function cancelarAtividade(usuarioId, edicaoId, inscricaoAtividadeId) {
  const edicao = await buscarPorId(edicaoId);
  exigirAberta(edicao);
  await inscricoesService.cancelarInscricaoAtividade(usuarioId, inscricaoAtividadeId);
}

async function cancelarGeral(usuarioId, edicaoId) {
  const edicao = await buscarPorId(edicaoId);
  exigirAberta(edicao);

  const inscricao = await inscricoesService.buscarInscricaoEdicao(usuarioId, edicaoId);
  if (!inscricao) throw new ErroHttp(404, "Inscrição não encontrada.");

  await inscricoesService.cancelarInscricaoEdicaoComPromocao(usuarioId, edicaoId);
}

module.exports = {
  listarParaUsuario,
  buscarEstado,
  inscreverOuAtualizar,
  cancelarAtividade,
  cancelarGeral,
};
