const prisma = require("../config/prisma");
const sincronizarLista = require("../utils/sincronizarLista");
const storageService = require("./storage.service");

const INCLUDE_PADRAO = {
  listas: {
    orderBy: { ordem: "asc" },
    include: { itens: { orderBy: { ordem: "asc" } } },
  },
};

async function camposItem(item, indice) {
  const campos = { nome: item.nome, link: item.link || null, ordem: indice };

  if (item.imagem === null) {
    campos.imagem = null;
  } else if (item.imagem && item.imagem.startsWith("data:image/")) {
    campos.imagem = await storageService.salvarImagemPublica(item.imagem, "grupos-conteudo-itens");
  }

  return campos;
}

async function removerImagemItem(item) {
  await storageService.removerImagemPublica(item.imagem);
}

// Resolve o segundo nível de aninhamento (lista -> itens) dentro do próprio
// montarCampos da lista, mesma técnica de camposArea em
// modalidadesSubmissao.service.js: pra lista nova não há nada pra diffar
// (create direto); pra lista existente, busca os itens atuais e monta um
// nested write nativo do Prisma (deleteMany/update/create) que entra junto
// no update/create da própria lista — tudo colapsa numa única
// prisma.$transaction, disparada por sincronizarLista no nível de cima.
async function camposLista(lista, indice) {
  const itens = (lista.itens || []).map((item, indiceItem) => ({ ...item, indiceItem }));

  const campos = { nome: lista.nome, ordem: indice };

  if (!lista.id) {
    campos.itens = {
      create: await Promise.all(itens.map((item) => camposItem(item, item.indiceItem))),
    };
    return campos;
  }

  const existentes = await prisma.itemConteudo.findMany({ where: { listaConteudoId: lista.id } });
  const idsRecebidos = itens.filter((item) => item.id).map((item) => item.id);
  const removidos = existentes.filter((item) => !idsRecebidos.includes(item.id));

  await Promise.all(removidos.map((item) => removerImagemItem(item)));

  campos.itens = {
    ...(removidos.length > 0 && { deleteMany: { id: { in: removidos.map((item) => item.id) } } }),
    update: await Promise.all(
      itens
        .filter((item) => item.id)
        .map(async (item) => ({ where: { id: item.id }, data: await camposItem(item, item.indiceItem) }))
    ),
    create: await Promise.all(
      itens.filter((item) => !item.id).map((item) => camposItem(item, item.indiceItem))
    ),
  };
  return campos;
}

async function listarGrupos(edicaoId) {
  return prisma.grupoConteudo.findMany({
    where: { edicaoId },
    include: INCLUDE_PADRAO,
    orderBy: { ordem: "asc" },
  });
}

async function buscarPorId(edicaoId, id) {
  return prisma.grupoConteudo.findFirst({
    where: { id, edicaoId },
    include: INCLUDE_PADRAO,
  });
}

async function criarGrupo(edicaoId, dados) {
  const { listas, ...camposGrupo } = dados;
  const listasCriadas =
    listas && listas.length > 0 ? await Promise.all(listas.map((lista, indice) => camposLista(lista, indice))) : undefined;

  return prisma.grupoConteudo.create({
    data: {
      ...camposGrupo,
      edicaoId,
      listas: listasCriadas ? { create: listasCriadas } : undefined,
    },
    include: INCLUDE_PADRAO,
  });
}

async function atualizarGrupo(id, dados) {
  const { listas, ...camposGrupo } = dados;

  const operacoes = listas
    ? await sincronizarLista(prisma.listaConteudo, "grupoConteudoId", id, listas, camposLista)
    : [];

  if (operacoes.length > 0) {
    await prisma.$transaction(operacoes);
  }

  return prisma.grupoConteudo.update({
    where: { id },
    data: camposGrupo,
    include: INCLUDE_PADRAO,
  });
}

async function excluirGrupo(id) {
  await prisma.grupoConteudo.delete({ where: { id } });
}

module.exports = {
  listarGrupos,
  buscarPorId,
  criarGrupo,
  atualizarGrupo,
  excluirGrupo,
};
