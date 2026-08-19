const prisma = require("../config/prisma");
const sincronizarLista = require("../utils/sincronizarLista");

const INCLUDE_PADRAO = {
  areas: {
    orderBy: { ordem: "asc" },
    include: { pessoas: { orderBy: { ordem: "asc" } } },
  },
};

function camposPessoa(pessoa, indice) {
  return {
    nome: pessoa.nome,
    afiliacao: pessoa.afiliacao ?? null,
    papel: pessoa.papel,
    ordem: indice,
  };
}

// Resolve o segundo nível de aninhamento (área -> pessoas) dentro do próprio
// montarCampos da área, sem precisar ensinar sincronizarLista a lidar com
// dois níveis: pra área nova não há nada pra diffar (create direto); pra
// área existente, busca as pessoas atuais e monta um nested write nativo do
// Prisma (deleteMany/update/create) que entra junto no update/create da
// própria área — tudo ainda colapsa numa única prisma.$transaction, como em
// atividades.service.js.
async function camposArea(area, indice) {
  const pessoas = (area.pessoas || []).map((pessoa, indicePessoa) => ({ ...pessoa, indicePessoa }));

  const campos = {
    slug: area.slug,
    titulo: area.titulo,
    descricao: area.descricao ?? null,
    ordem: indice,
  };

  if (!area.id) {
    campos.pessoas = {
      create: pessoas.map((pessoa) => camposPessoa(pessoa, pessoa.indicePessoa)),
    };
    return campos;
  }

  const existentes = await prisma.pessoaAreaSubmissao.findMany({ where: { areaSubmissaoId: area.id } });
  const idsRecebidos = pessoas.filter((pessoa) => pessoa.id).map((pessoa) => pessoa.id);
  const removidos = existentes.filter((pessoa) => !idsRecebidos.includes(pessoa.id));

  campos.pessoas = {
    ...(removidos.length > 0 && { deleteMany: { id: { in: removidos.map((pessoa) => pessoa.id) } } }),
    update: pessoas
      .filter((pessoa) => pessoa.id)
      .map((pessoa) => ({ where: { id: pessoa.id }, data: camposPessoa(pessoa, pessoa.indicePessoa) })),
    create: pessoas
      .filter((pessoa) => !pessoa.id)
      .map((pessoa) => camposPessoa(pessoa, pessoa.indicePessoa)),
  };
  return campos;
}

async function listarModalidades(edicaoId) {
  return prisma.modalidadeSubmissao.findMany({
    where: { edicaoId },
    include: INCLUDE_PADRAO,
    orderBy: { ordem: "asc" },
  });
}

async function buscarPorId(edicaoId, id) {
  return prisma.modalidadeSubmissao.findFirst({
    where: { id, edicaoId },
    include: INCLUDE_PADRAO,
  });
}

async function buscarPorSlug(edicaoId, slug) {
  return prisma.modalidadeSubmissao.findFirst({
    where: { edicaoId, slug },
    include: INCLUDE_PADRAO,
  });
}

async function criarModalidade(edicaoId, dados) {
  const { areas, ...camposModalidade } = dados;
  const areasCriadas =
    areas && areas.length > 0
      ? await Promise.all(areas.map((area, indice) => camposArea(area, indice)))
      : undefined;

  return prisma.modalidadeSubmissao.create({
    data: {
      ...camposModalidade,
      edicaoId,
      areas: areasCriadas ? { create: areasCriadas } : undefined,
    },
    include: INCLUDE_PADRAO,
  });
}

async function atualizarModalidade(id, dados) {
  const { areas, ...camposModalidade } = dados;

  const operacoes = areas
    ? await sincronizarLista(prisma.areaSubmissao, "modalidadeSubmissaoId", id, areas, camposArea)
    : [];

  if (operacoes.length > 0) {
    await prisma.$transaction(operacoes);
  }

  return prisma.modalidadeSubmissao.update({
    where: { id },
    data: camposModalidade,
    include: INCLUDE_PADRAO,
  });
}

async function excluirModalidade(id) {
  await prisma.modalidadeSubmissao.delete({ where: { id } });
}

module.exports = {
  listarModalidades,
  buscarPorId,
  buscarPorSlug,
  criarModalidade,
  atualizarModalidade,
  excluirModalidade,
};
