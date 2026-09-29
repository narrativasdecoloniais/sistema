const prisma = require("../config/prisma");

// Todos os usuários da base (exceto anonimizados — contas excluídas via LGPD,
// sem dado útil) com a situação de cada um na edição: se tem inscrição geral,
// quantas inscrições em atividades (separadas por status) e a quantas
// submissões da edição a conta está vinculada. Cinco consultas no total, sem
// N+1, todas em paralelo.
//
// "Vinculada a uma submissão" = quem enviou (Submissao.usuarioId) OU autor/
// coautor associado pelo e-mail (SubmissaoAutor.usuarioId) — contando cada
// submissão uma vez só, mesmo quando a pessoa é as duas coisas.
async function listarComSituacaoNaEdicao(edicaoId) {
  const [usuarios, inscricoesGerais, contagensAtividades, submissoesEnviadas, autorias] =
    await Promise.all([
    prisma.usuario.findMany({
      where: { anonimizadoEm: null },
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        documentoEstrangeiro: true,
        pais: true,
        instituicao: true,
        papeis: true,
        createdAt: true,
      },
      orderBy: { nome: "asc" },
    }),
    prisma.inscricaoEdicao.findMany({
      where: { edicaoId },
      select: { usuarioId: true },
    }),
    prisma.inscricaoAtividade.groupBy({
      by: ["usuarioId", "status"],
      where: { atividade: { edicaoId } },
      _count: { _all: true },
    }),
    prisma.submissao.findMany({
      where: { edicaoId },
      select: { id: true, usuarioId: true },
    }),
    prisma.submissaoAutor.findMany({
      where: { usuarioId: { not: null }, submissao: { edicaoId } },
      select: { submissaoId: true, usuarioId: true },
    }),
  ]);

  const inscritosNaEdicao = new Set(inscricoesGerais.map((inscricao) => inscricao.usuarioId));
  const atividadesPorUsuario = new Map();
  for (const linha of contagensAtividades) {
    const atual = atividadesPorUsuario.get(linha.usuarioId) || { confirmadas: 0, listaEspera: 0 };
    if (linha.status === "CONFIRMADA") atual.confirmadas = linha._count._all;
    else atual.listaEspera = linha._count._all;
    atividadesPorUsuario.set(linha.usuarioId, atual);
  }

  const submissoesPorUsuario = new Map();
  const vincular = (usuarioId, submissaoId) => {
    if (!submissoesPorUsuario.has(usuarioId)) submissoesPorUsuario.set(usuarioId, new Set());
    submissoesPorUsuario.get(usuarioId).add(submissaoId);
  };
  submissoesEnviadas.forEach((submissao) => vincular(submissao.usuarioId, submissao.id));
  autorias.forEach((autoria) => vincular(autoria.usuarioId, autoria.submissaoId));

  return usuarios.map((usuario) => ({
    ...usuario,
    inscritoNaEdicao: inscritosNaEdicao.has(usuario.id),
    atividades: atividadesPorUsuario.get(usuario.id) || { confirmadas: 0, listaEspera: 0 },
    submissoes: submissoesPorUsuario.get(usuario.id)?.size || 0,
  }));
}

module.exports = { listarComSituacaoNaEdicao };
