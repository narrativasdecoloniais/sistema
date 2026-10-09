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

// Trabalhos da pessoa (autora ou coautora) vinculados a uma atividade de
// apresentação nesta edição — mesma regra de Minhas submissões: só depois de
// "Liberar para os autores" (Edicao.apresentacaoPublicadaEm). Vai para o
// comprovante de inscrição.
async function listarApresentacoes(usuarioId, edicao) {
  if (!edicao?.apresentacaoPublicadaEm) return [];

  const submissoes = await prisma.submissao.findMany({
    where: {
      edicaoId: edicao.id,
      atividadeApresentacaoId: { not: null },
      autores: { some: { usuarioId } },
    },
    select: {
      id: true,
      titulo: true,
      ordemApresentacao: true,
      atividadeApresentacao: {
        select: { nome: true, local: true, inicioAtividade: true, fimAtividade: true },
      },
    },
  });

  return submissoes.sort(
    (a, b) =>
      a.atividadeApresentacao.inicioAtividade - b.atividadeApresentacao.inicioAtividade ||
      (a.ordemApresentacao ?? 0) - (b.ordemApresentacao ?? 0)
  );
}

async function buscarEstado(usuarioId, edicaoId) {
  const edicao = await buscarPorId(edicaoId);
  const [estado, apresentacoes] = await Promise.all([
    inscricoesService.buscarEstadoInscricao(edicaoId, usuarioId),
    listarApresentacoes(usuarioId, edicao),
  ]);
  return { edicao, aberta: inscricoesAbertas(edicao), ...estado, apresentacoes };
}

function exigirAberta(edicao) {
  if (!inscricoesAbertas(edicao)) {
    throw new ErroHttp(409, "As inscrições desta edição não estão abertas.");
  }
}

async function inscreverOuAtualizar(usuarioId, edicaoId, atividadeIds, adaptacao) {
  const edicao = await buscarPorId(edicaoId);
  exigirAberta(edicao);

  // A pergunta de acessibilidade é obrigatória na primeira inscrição (a que
  // cria a inscrição geral); depois disso a resposta muda por atualizarAdaptacao.
  const jaInscrito = await inscricoesService.buscarInscricaoEdicao(usuarioId, edicaoId);
  if (!jaInscrito && !adaptacao) {
    throw new ErroHttp(400, "Responda se você necessita de alguma adaptação ou recurso para participar.");
  }

  return inscricoesService.finalizarInscricao({ usuarioId, edicaoId, atividadeIds, adaptacao });
}

// Sem o gate da janela de inscrições: é informação de acessibilidade, que a
// pessoa pode corrigir até o evento mesmo com as inscrições encerradas.
async function atualizarAdaptacao(usuarioId, edicaoId, adaptacao) {
  await buscarPorId(edicaoId);
  const inscricao = await inscricoesService.buscarInscricaoEdicao(usuarioId, edicaoId);
  if (!inscricao) throw new ErroHttp(404, "Inscrição não encontrada.");

  return prisma.inscricaoEdicao.update({ where: { id: inscricao.id }, data: adaptacao });
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
  if (inscricao.credenciadoEm) {
    throw new ErroHttp(409, "Você já foi credenciado(a) no evento. Para cancelar a inscrição, fale com a equipe do evento.");
  }

  await inscricoesService.cancelarInscricaoEdicaoComPromocao(usuarioId, edicaoId);
}

module.exports = {
  atualizarAdaptacao,
  listarParaUsuario,
  buscarEstado,
  inscreverOuAtualizar,
  cancelarAtividade,
  cancelarGeral,
};
