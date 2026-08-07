const prisma = require("../config/prisma");
const sincronizarLista = require("../utils/sincronizarLista");
const storageService = require("./storage.service");
const ErroHttp = require("../utils/erroHttp");

const INCLUDE_PADRAO = {
  tipoAtividade: true,
  pessoas: { orderBy: { createdAt: "asc" }, include: { tipoParticipacao: true } },
};

async function camposPessoa(pessoa) {
  const campos = {
    nome: pessoa.nome,
    descricao: pessoa.descricao ?? null,
    breveDescricao: pessoa.breveDescricao ?? null,
    tipoParticipacaoId: pessoa.tipoParticipacaoId,
  };

  if (pessoa.imagem === null) {
    campos.imagem = null;
  } else if (pessoa.imagem && pessoa.imagem.startsWith("data:image/")) {
    campos.imagem = await storageService.salvarImagemPublica(pessoa.imagem, "atividade-pessoas");
  }

  return campos;
}

async function removerImagemPessoa(pessoa) {
  await storageService.removerImagemPublica(pessoa.imagem);
}

// exigeInscricao/semLimiteVagas/vagas se condicionam entre si — sem
// inscrição não faz sentido ter limite de vagas, e com limite ligado o
// número de vagas não se aplica. Normalizado aqui pra nunca gravar uma
// combinação inconsistente, independente do que o cliente mandou.
function normalizarInscricao(dados) {
  const exigeInscricao = dados.exigeInscricao !== false;
  const semLimiteVagas = exigeInscricao && Boolean(dados.semLimiteVagas);

  return {
    exigeInscricao,
    semLimiteVagas,
    vagas: exigeInscricao && !semLimiteVagas ? dados.vagas : null,
  };
}

async function listarAtividades(edicaoId) {
  return prisma.atividade.findMany({
    where: { edicaoId },
    include: INCLUDE_PADRAO,
    orderBy: { createdAt: "asc" },
  });
}

async function buscarPorId(edicaoId, id) {
  return prisma.atividade.findFirst({
    where: { id, edicaoId },
    include: INCLUDE_PADRAO,
  });
}

async function buscarPorSlug(edicaoId, slug) {
  return prisma.atividade.findFirst({
    where: { edicaoId, slug },
    include: INCLUDE_PADRAO,
  });
}

async function criarAtividade(edicaoId, dados) {
  const { pessoas, ...camposAtividade } = dados;
  const pessoasCriadas = pessoas && pessoas.length > 0 ? await Promise.all(pessoas.map(camposPessoa)) : undefined;

  return prisma.atividade.create({
    data: {
      ...camposAtividade,
      ...normalizarInscricao(dados),
      edicaoId,
      pessoas: pessoasCriadas ? { create: pessoasCriadas } : undefined,
    },
    include: INCLUDE_PADRAO,
  });
}

async function atualizarAtividade(id, dados) {
  const { pessoas, ...camposAtividade } = dados;

  const operacoes = pessoas
    ? await sincronizarLista(prisma.atividadePessoa, "atividadeId", id, pessoas, camposPessoa, removerImagemPessoa)
    : [];

  if (operacoes.length > 0) {
    await prisma.$transaction(operacoes);
  }

  return prisma.atividade.update({
    where: { id },
    data: { ...camposAtividade, ...normalizarInscricao(dados) },
    include: INCLUDE_PADRAO,
  });
}

async function excluirAtividade(id) {
  const totalInscricoes = await prisma.inscricaoAtividade.count({ where: { atividadeId: id } });
  if (totalInscricoes > 0) {
    throw new ErroHttp(409, "Não é possível excluir uma atividade com inscrições.");
  }
  await prisma.atividade.delete({ where: { id } });
}

module.exports = {
  listarAtividades,
  buscarPorId,
  buscarPorSlug,
  criarAtividade,
  atualizarAtividade,
  excluirAtividade,
};
