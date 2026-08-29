const prisma = require("../config/prisma");
const sincronizarLista = require("../utils/sincronizarLista");
const storageService = require("./storage.service");
const sanitizarSvgLogo = require("../utils/sanitizarSvgLogo");
const sanitizarCorpoContribuicao = require("../utils/sanitizarCorpoContribuicao");
const ErroHttp = require("../utils/erroHttp");

const INCLUDE_PADRAO = {
  realizadores: { orderBy: { createdAt: "asc" } },
  apoiadores: { orderBy: { createdAt: "asc" } },
  pontosInteresse: { orderBy: { createdAt: "asc" } },
};

async function montarCamposRealizador(realizador) {
  const campos = { nome: realizador.nome, link: realizador.link || null };

  if (realizador.imagem && realizador.imagem.startsWith("data:image/")) {
    campos.imagem = await storageService.salvarImagemPublica(realizador.imagem, "edicao-realizadores");
  }

  return campos;
}

async function removerImagemRealizador(realizador) {
  await storageService.removerImagemPublica(realizador.imagem);
}

async function montarCamposApoiador(apoiador) {
  const campos = { nome: apoiador.nome, link: apoiador.link || null };

  if (apoiador.imagem && apoiador.imagem.startsWith("data:image/")) {
    campos.imagem = await storageService.salvarImagemPublica(apoiador.imagem, "edicao-apoiadores");
  }

  return campos;
}

async function removerImagemApoiador(apoiador) {
  await storageService.removerImagemPublica(apoiador.imagem);
}

async function montarCamposPontoInteresse(ponto) {
  return {
    tipo: ponto.tipo,
    nome: ponto.nome,
    endereco: ponto.endereco || null,
    latitude: ponto.latitude,
    longitude: ponto.longitude,
    link: ponto.link || null,
  };
}

// Imagem raster comum de um campo escalar da própria Edicao (não uma lista
// como realizadores) — usado pelas faixas laterais e pelo fundo da Hero,
// cada um com seu par desktop/mobile. Sobe a nova pro GCS (na pasta
// informada) e remove a antiga, seja trocando ou removendo (null).
async function processarImagemEscalar(id, campo, novoValor, pasta, camposEdicao) {
  if (novoValor === null) {
    const atual = await prisma.edicao.findUnique({ where: { id }, select: { [campo]: true } });
    await storageService.removerImagemPublica(atual?.[campo]);
    camposEdicao[campo] = null;
  } else if (typeof novoValor === "string" && novoValor.startsWith("data:image/")) {
    const atual = await prisma.edicao.findUnique({ where: { id }, select: { [campo]: true } });
    camposEdicao[campo] = await storageService.salvarImagemPublica(novoValor, pasta);
    await storageService.removerImagemPublica(atual?.[campo]);
  }
}

async function listarEdicoes() {
  return prisma.edicao.findMany({ orderBy: { numero: "desc" } });
}

async function buscarPorId(id) {
  return prisma.edicao.findUnique({ where: { id }, include: INCLUDE_PADRAO });
}

async function buscarEdicaoAtual() {
  return prisma.edicao.findFirst({ orderBy: { numero: "desc" }, include: INCLUDE_PADRAO });
}

async function buscarPorSlug(slug) {
  return prisma.edicao.findUnique({ where: { slug }, include: INCLUDE_PADRAO });
}

async function listarEdicoesAnteriores(numeroAtual) {
  return prisma.edicao.findMany({
    where: { numero: { lt: numeroAtual } },
    orderBy: { numero: "desc" },
    select: { id: true, numero: true, nome: true, slug: true },
  });
}

async function criarEdicao(dados) {
  return prisma.edicao.create({ data: dados });
}

async function atualizarEdicao(id, dados) {
  const {
    realizadores,
    apoiadores,
    pontosInteresse,
    logoSvg,
    logoSvgCores,
    imagemFaixaHeroDesktop,
    imagemFaixaHeroMobile,
    imagemFundoHeroDesktop,
    imagemFundoHeroMobile,
    corpoContribuicao,
    qrCodeContribuicao,
    ...camposEdicao
  } = dados;

  if (corpoContribuicao !== undefined) {
    try {
      camposEdicao.corpoContribuicao = sanitizarCorpoContribuicao(corpoContribuicao);
    } catch (erro) {
      throw new ErroHttp(400, erro.message || "Texto de contribuição inválido.");
    }
  }

  if (logoSvg === null) {
    camposEdicao.logoSvg = null;
    camposEdicao.logoSvgViewBox = null;
    camposEdicao.logoSvgCores = null;
  } else if (typeof logoSvg === "string") {
    try {
      const { markup, viewBox, cores } = sanitizarSvgLogo(logoSvg);
      camposEdicao.logoSvg = markup;
      camposEdicao.logoSvgViewBox = viewBox;
      camposEdicao.logoSvgCores = cores;
    } catch (erro) {
      throw new ErroHttp(400, erro.message || "SVG inválido.");
    }
  } else if (logoSvgCores !== undefined) {
    // Edição pontual de cores já extraídas, sem reenviar o arquivo — só
    // entra aqui quando o upload não mexeu no logoSvg nesta mesma chamada
    // (upload sempre recalcula o mapa a partir do arquivo novo).
    camposEdicao.logoSvgCores = logoSvgCores;
  }

  await processarImagemEscalar(id, "imagemFaixaHeroDesktop", imagemFaixaHeroDesktop, "edicoes-faixa-hero", camposEdicao);
  await processarImagemEscalar(id, "imagemFaixaHeroMobile", imagemFaixaHeroMobile, "edicoes-faixa-hero", camposEdicao);
  await processarImagemEscalar(id, "imagemFundoHeroDesktop", imagemFundoHeroDesktop, "edicoes-fundo-hero", camposEdicao);
  await processarImagemEscalar(id, "imagemFundoHeroMobile", imagemFundoHeroMobile, "edicoes-fundo-hero", camposEdicao);
  await processarImagemEscalar(id, "qrCodeContribuicao", qrCodeContribuicao, "edicoes-contribuicao", camposEdicao);

  if (realizadores !== undefined) {
    const operacoes = await sincronizarLista(
      prisma.edicaoRealizador,
      "edicaoId",
      id,
      realizadores,
      montarCamposRealizador,
      removerImagemRealizador
    );
    if (operacoes.length > 0) {
      await prisma.$transaction(operacoes);
    }
  }

  if (apoiadores !== undefined) {
    const operacoes = await sincronizarLista(
      prisma.edicaoApoiador,
      "edicaoId",
      id,
      apoiadores,
      montarCamposApoiador,
      removerImagemApoiador
    );
    if (operacoes.length > 0) {
      await prisma.$transaction(operacoes);
    }
  }

  if (pontosInteresse !== undefined) {
    const operacoes = await sincronizarLista(
      prisma.edicaoPontoInteresse,
      "edicaoId",
      id,
      pontosInteresse,
      montarCamposPontoInteresse
    );
    if (operacoes.length > 0) {
      await prisma.$transaction(operacoes);
    }
  }

  return prisma.edicao.update({ where: { id }, data: camposEdicao, include: INCLUDE_PADRAO });
}

async function excluirEdicao(id) {
  await prisma.edicao.delete({ where: { id } });
}

module.exports = {
  listarEdicoes,
  buscarPorId,
  buscarEdicaoAtual,
  buscarPorSlug,
  listarEdicoesAnteriores,
  criarEdicao,
  atualizarEdicao,
  excluirEdicao,
};
