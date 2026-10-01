const sharp = require("sharp");
const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");
const storageService = require("./storage.service");
const anaisService = require("./anais.service");
const { htmlParaBlocos, percorrerBlocos } = require("../utils/htmlParaBlocos");
const { DATA_URI_IMAGEM } = require("../utils/sanitizadorRichText");
const { LICENCAS_ANAIS } = require("../utils/licencasAnais");
const { autorAbnt } = require("../utils/citacao");
const { filtroSubmissoesAnais } = require("../utils/criterioAnais");

// Monta o modelo neutro dos Anais (dados + rich text em blocos + imagens já
// carregadas) que pdfAnais.service.js e docxAnais.service.js desenham. Nada
// aqui sabe de PDF ou Word.

// Imagem do resumo: no máximo 1600 px de largura (sobra para impressão em
// A4 a ~200 dpi) — segura o tamanho do arquivo final com muitos trabalhos.
const LARGURA_MAX_IMAGEM = 1600;

async function lerBufferImagem(src) {
  if (DATA_URI_IMAGEM.test(src)) return Buffer.from(src.slice(src.indexOf(",") + 1), "base64");
  if (storageService.ehUrlPublica(src)) return storageService.lerArquivoPublico(src);
  return null;
}

// Normaliza para PNG (ou JPEG, se já for) e mede — pdfmake e docx só
// aceitam esses formatos, e os dois precisam das dimensões.
async function prepararImagem(buffer) {
  const entrada = sharp(buffer, { failOn: "none" }).rotate();
  const { format } = await entrada.metadata();
  let pipeline = entrada.resize({ width: LARGURA_MAX_IMAGEM, withoutEnlargement: true });
  pipeline = format === "jpeg" ? pipeline.jpeg({ quality: 85 }) : pipeline.png({ compressionLevel: 9 });
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  return { dados: data, formato: info.format === "jpeg" ? "jpg" : "png", largura: info.width, altura: info.height };
}

// Preenche dados/largura/altura de cada bloco de imagem; a que não carregar
// (arquivo removido do bucket, formato corrompido) é marcada como ausente e
// os geradores simplesmente a pulam.
async function carregarImagens(listasDeBlocos) {
  const cache = new Map();
  for (const blocos of listasDeBlocos) {
    for (const bloco of percorrerBlocos(blocos)) {
      if (bloco.tipo !== "imagem") continue;
      if (!cache.has(bloco.src)) {
        const promessa = (async () => {
          try {
            const buffer = await lerBufferImagem(bloco.src);
            return buffer ? await prepararImagem(buffer) : null;
          } catch (erro) {
            console.error(`[anais] imagem ignorada (${bloco.src.slice(0, 80)}):`, erro.message);
            return null;
          }
        })();
        cache.set(bloco.src, promessa);
      }
      const imagem = await cache.get(bloco.src);
      if (imagem) Object.assign(bloco, imagem);
      else bloco.ausente = true;
    }
  }
}

// Logo da edição (SVG com as cores editáveis em var(--logo-cor-N)) em PNG.
async function prepararLogo(edicao) {
  if (!edicao.logoSvg || !edicao.logoSvgViewBox) return null;
  const cores = edicao.logoSvgCores || {};
  const conteudo = edicao.logoSvg.replace(/var\(\s*(--logo-cor-\d+)\s*\)/g, (_, nome) => cores[nome] || "#201914");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${edicao.logoSvgViewBox}">${conteudo}</svg>`;
  try {
    const { data, info } = await sharp(Buffer.from(svg), { density: 300 })
      .resize({ width: 1200, height: 1200, fit: "inside" })
      .png()
      .toBuffer({ resolveWithObject: true });
    return { dados: data, formato: "png", largura: info.width, altura: info.height };
  } catch (erro) {
    console.error("[anais] logo ignorada:", erro.message);
    return null;
  }
}

async function carregarExpediente(edicaoId, ids) {
  if (!ids?.length) return [];
  const grupos = await prisma.grupoConteudo.findMany({
    where: { edicaoId, id: { in: ids } },
    select: {
      nome: true,
      listas: {
        select: { nome: true, itens: { select: { nome: true }, orderBy: { ordem: "asc" } } },
        orderBy: { ordem: "asc" },
      },
    },
    orderBy: { ordem: "asc" },
  });
  return grupos.map((grupo) => ({
    nome: grupo.nome,
    listas: grupo.listas
      .map((lista) => ({ nome: lista.nome, itens: lista.itens.map((item) => item.nome) }))
      .filter((lista) => lista.itens.length),
  }));
}

const SELECT_SUBMISSAO_DOCUMENTO = {
  id: true,
  titulo: true,
  resumo: true,
  referenciaBibliografica: true,
  autores: { select: { nome: true, orcid: true }, orderBy: { ordem: "asc" } },
  modalidadeSubmissao: { select: { id: true, nome: true, ordem: true } },
  areaSubmissao: { select: { id: true, titulo: true, ordem: true } },
};

function montarArtigo(edicao, anais, artigo) {
  const { submissao } = artigo;
  return {
    id: artigo.id,
    slug: artigo.slug,
    titulo: submissao.titulo,
    autores: submissao.autores,
    modalidade: submissao.modalidadeSubmissao,
    area: submissao.areaSubmissao,
    resumo: htmlParaBlocos(submissao.resumo),
    referencias: htmlParaBlocos(submissao.referenciaBibliografica),
    paginaInicial: artigo.paginaInicial,
    paginaFinal: artigo.paginaFinal,
    // Sem páginas: quem desenha decide (o PDF completo calcula as próprias).
    citacao: anaisService.dadosCitacao(edicao, anais, { ...artigo, paginaInicial: null, paginaFinal: null }, submissao),
  };
}

// Modalidade → área → artigos, já na ordem canônica.
function agruparSecoes(artigos) {
  const secoes = [];
  for (const artigo of artigos) {
    let secao = secoes[secoes.length - 1];
    if (!secao || secao.modalidade.id !== artigo.modalidade.id) {
      secao = { modalidade: artigo.modalidade, areas: [] };
      secoes.push(secao);
    }
    let area = secao.areas[secao.areas.length - 1];
    const areaId = artigo.area?.id || null;
    if (!area || area.id !== areaId) {
      area = { id: areaId, titulo: artigo.area?.titulo || null, artigos: [] };
      secao.areas.push(area);
    }
    area.artigos.push(artigo);
  }
  return secoes;
}

// Índice remissivo de autores: "SILVA, Maria da" → artigos, em ordem
// alfabética (sem acento pesar na ordem).
function indiceAutores(artigos) {
  const porNome = new Map();
  for (const artigo of artigos) {
    for (const autor of artigo.autores) {
      const chave = autor.nome.trim().toLocaleLowerCase("pt-BR");
      if (!porNome.has(chave)) porNome.set(chave, { nome: autorAbnt(autor.nome), artigos: [] });
      const entrada = porNome.get(chave);
      if (!entrada.artigos.includes(artigo.id)) entrada.artigos.push(artigo.id);
    }
  }
  return [...porNome.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
}

function dadosEdicaoDocumento(edicao) {
  return {
    id: edicao.id,
    numero: edicao.numero,
    nome: edicao.nome,
    slug: edicao.slug,
    cidade: edicao.cidade,
    estado: edicao.estado,
    dataInicio: edicao.dataInicio,
    dataFim: edicao.dataFim,
  };
}

async function buscarEdicaoDocumento(where) {
  const edicao = await prisma.edicao.findUnique({
    where,
    select: {
      id: true,
      numero: true,
      nome: true,
      slug: true,
      cidade: true,
      estado: true,
      dataInicio: true,
      dataFim: true,
      logoSvg: true,
      logoSvgViewBox: true,
      logoSvgCores: true,
      anais: true,
    },
  });
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
  if (!edicao.anais) throw new ErroHttp(409, "Salve as configurações dos Anais antes de gerar os arquivos.");
  return edicao;
}

// Anais completos da edição.
async function montarDocumentoAnais(edicaoId) {
  const edicao = await buscarEdicaoDocumento({ id: edicaoId });
  const { anais } = edicao;

  await anaisService.sincronizarArtigos(edicaoId);
  const registros = await anaisService.listarArtigosVisiveis(edicaoId, SELECT_SUBMISSAO_DOCUMENTO);
  if (!registros.length) throw new ErroHttp(409, "Não há nenhum trabalho nos Anais para gerar o arquivo.");

  const artigos = registros.map((registro) => montarArtigo(edicao, anais, registro));
  const apresentacao = htmlParaBlocos(anais.apresentacao);
  await carregarImagens([apresentacao, ...artigos.flatMap((artigo) => [artigo.resumo, artigo.referencias])]);

  return {
    edicao: dadosEdicaoDocumento(edicao),
    anais: { ...anais, licencaInfo: LICENCAS_ANAIS[anais.licenca] },
    logo: await prepararLogo(edicao),
    expediente: await carregarExpediente(edicaoId, anais.gruposConteudoIds),
    apresentacao,
    secoes: agruparSecoes(artigos),
    artigos,
    autores: indiceAutores(artigos),
  };
}

// Um trabalho só (PDF individual da página pública) — mesma checagem de
// visibilidade das páginas públicas.
async function montarDocumentoArtigo(edicaoSlug, artigoSlug) {
  const edicao = await buscarEdicaoDocumento({ slug: edicaoSlug });
  if (!edicao.anais.publicadoEm) throw new ErroHttp(404, "Anais não encontrados.");

  const registro = await prisma.artigoAnais.findFirst({
    where: { edicaoId: edicao.id, slug: artigoSlug, ocultoEm: null, submissao: filtroSubmissoesAnais(edicao.id) },
    select: {
      id: true,
      slug: true,
      paginaInicial: true,
      paginaFinal: true,
      submissao: { select: SELECT_SUBMISSAO_DOCUMENTO },
    },
  });
  if (!registro) throw new ErroHttp(404, "Trabalho não encontrado nos Anais.");

  const artigo = montarArtigo(edicao, edicao.anais, registro);
  await carregarImagens([artigo.resumo, artigo.referencias]);

  return {
    edicao: dadosEdicaoDocumento(edicao),
    anais: { ...edicao.anais, licencaInfo: LICENCAS_ANAIS[edicao.anais.licenca] },
    artigo,
  };
}

module.exports = { montarDocumentoAnais, montarDocumentoArtigo, carregarImagens, indiceAutores, agruparSecoes };
