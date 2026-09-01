#!/usr/bin/env node
// Migra submissões de trabalho do Even3 (planilha .xlsm) para Submissao/
// SubmissaoAutor. Roda em duas fases: (A) baixa os arquivos do Drive, extrai
// texto+imagens de cada um e monta um índice de imagens repetidas entre
// arquivos diferentes (logo/moldura do modelo, não conteúdo — ver
// identificarHashesTemplate); (B) cria as submissões de fato, usando o que
// foi extraído na fase A e filtrando as imagens de template.
//
// Uso:
//   node src/scripts/importarSubmissoesEven3.js [opções]
//
// Opções:
//   --arquivo=<caminho>       .xlsm de origem (default: ~/Downloads/V-Narrativas-2026.xlsm)
//   --edicao=<id>             edicaoId de destino (default: V edição, ee4d88f6-...)
//   --cache=<pasta>           pasta de cache de downloads/extração (default: <script>/.cache-importacao)
//   --dry-run                 fase B não grava nada, só loga o que faria
//   --limite=N                processa só as N primeiras linhas (todas as abas concatenadas)
//   --pular-indexacao         reusa o cache de extração de um run anterior sem rebaixar/reprocessar

require("../config/env");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const XLSX = require("xlsx");
const mammoth = require("mammoth");
const { PDFParse } = require("pdf-parse");
const sharp = require("sharp");
const { JSDOM } = require("jsdom");
const Anthropic = require("@anthropic-ai/sdk");
const prisma = require("../config/prisma");
const usuariosService = require("../services/usuarios.service");
const sanitizarResumoSubmissao = require("../utils/sanitizarResumoSubmissao");
const sanitizarReferenciaBibliografica = require("../utils/sanitizarReferenciaBibliografica");
const processarImagensEmbutidas = require("../utils/processarImagensEmbutidas");

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

function lerArgs() {
  const args = {
    arquivo: path.join(os.homedir(), "Downloads", "V-Narrativas-2026.xlsm"),
    edicaoId: "ee4d88f6-d852-4fa2-98c4-98a60098d4c9",
    cache: path.join(__dirname, ".cache-importacao"),
    dryRun: false,
    limite: null,
    pularIndexacao: false,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--pular-indexacao") args.pularIndexacao = true;
    else if (arg.startsWith("--arquivo=")) args.arquivo = arg.slice("--arquivo=".length);
    else if (arg.startsWith("--edicao=")) args.edicaoId = arg.slice("--edicao=".length);
    else if (arg.startsWith("--cache=")) args.cache = arg.slice("--cache=".length);
    else if (arg.startsWith("--limite=")) args.limite = Number(arg.slice("--limite=".length));
  }

  return args;
}

// ---------------------------------------------------------------------------
// Mapeamento aba -> modalidade/área (por nome da aba, não pela coluna "Área
// Temática" da planilha — que vem com formatação inconsistente).
// ---------------------------------------------------------------------------

function resolverModalidadeEArea(nomeAba) {
  if (nomeAba === "Experiencias") {
    return { modalidadeSlug: "narrativas-multimodais", areaSlug: null };
  }

  const match = nomeAba.match(/Conversatório\s+(\d+)/);
  if (match) {
    return { modalidadeSlug: "conversatorios", areaSlug: `conversatorio-${match[1]}` };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Download (Google Drive, links "qualquer pessoa com o link")
// ---------------------------------------------------------------------------

function extrairFileIdDrive(url) {
  const match = (url || "").match(/\/d\/([^/]+)/);
  return match ? match[1] : null;
}

async function baixarArquivoDrive(fileId, destino) {
  const baseUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  let resposta = await fetch(baseUrl, { redirect: "follow" });
  let buffer = Buffer.from(await resposta.arrayBuffer());

  const contentType = resposta.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    const html = buffer.toString("utf8");
    const match = html.match(/confirm=([0-9A-Za-z_-]+)/);
    if (!match) {
      throw new Error("Drive retornou uma página de aviso sem token de confirmação.");
    }
    resposta = await fetch(`${baseUrl}&confirm=${match[1]}`, { redirect: "follow" });
    buffer = Buffer.from(await resposta.arrayBuffer());
  }

  fs.writeFileSync(destino, buffer);
}

async function resolverArquivoLocal({ numero, linkTrabalho, url, pastaDownloads }) {
  const destino = path.join(pastaDownloads, linkTrabalho);
  if (fs.existsSync(destino)) return destino;

  const fileId = extrairFileIdDrive(url);
  if (!fileId) throw new Error(`URL do Drive inválida: "${url}"`);

  await baixarArquivoDrive(fileId, destino);
  return destino;
}

// ---------------------------------------------------------------------------
// Extração de texto + imagens
// ---------------------------------------------------------------------------

function hashBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// Redimensiona/comprime como JPEG — mesmos parâmetros que o frontend usa
// pra fotos de conteúdo coladas no editor (CampoRichText.jsx, forcarJpeg),
// só que rodando no Node via sharp em vez de canvas do navegador. Sem isso,
// fotos de câmera em alta resolução (vistas em vários docs de origem, até
// 4000x4000+) facilmente passam do limite de tamanho do resumo — de ~1.3MB
// por foto pra ~85KB depois de comprimida (testado com arquivo real).
// Retorna null se a imagem não puder ser decodificada (formato exótico/
// corrompida) — pula essa imagem específica em vez de abortar o documento.
async function comprimirImagem(buffer) {
  try {
    return await sharp(buffer)
      .resize(900, 900, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch {
    return null;
  }
}

// Proteção contra estouro de memória e alinhado com o limite real do
// backend: o HTML bruto do resumo (texto + imagens em base64, antes do
// upload pro GCS) não pode passar de TAMANHO_MAX_ENTRADA em
// sanitizarResumoSubmissao.js (3.000.000 caracteres). Com a compressão
// acima, imagens comuns nunca chegam perto disso — esses limites ficam só
// como rede de segurança pra casos extremos (muitas fotos no mesmo doc).
const LIMITE_BYTES_POR_IMAGEM = 1.5 * 1024 * 1024;
const LIMITE_BYTES_TOTAL_IMAGENS = 6 * 1024 * 1024;

async function extrairDocx(caminho) {
  const opcoes = {
    styleMap: [
      "p[style-name='Heading 1'] => p:fresh",
      "p[style-name='Heading 2'] => p:fresh",
      "p[style-name='Heading 3'] => p:fresh",
      "p[style-name='Title'] => p:fresh",
    ],
    convertImage: mammoth.images.imgElement((imagem) =>
      imagem.read("base64").then((base64) => ({ src: `data:${imagem.contentType};base64,${base64}` }))
    ),
  };

  const resultado = await mammoth.convertToHtml({ path: caminho }, opcoes);

  // O <img alt="..."> que o mammoth gera traz o caminho do arquivo local do
  // computador de quem escreveu o Word (ex. "C:\Users\...\foto.jpg") — nunca
  // deve vazar isso; zera o alt, mesmo padrão do resto do app.
  const htmlSemAltLocal = resultado.value.replace(/<img([^>]*)alt="[^"]*"([^>]*)>/g, '<img$1alt=""$2>');

  const imagens = [];
  let bytesTotais = 0;
  let imagemGigante = false;
  let html = htmlSemAltLocal;
  const regexImg = /<img[^>]*src="data:([^;]+);base64,([^"]+)"[^>]*>/g;
  let match;
  while ((match = regexImg.exec(htmlSemAltLocal))) {
    const [tagOriginal, , base64Original] = match;
    const bufferOriginal = Buffer.from(base64Original, "base64");
    const bufferComprimido = await comprimirImagem(bufferOriginal);
    if (!bufferComprimido) {
      html = html.replace(tagOriginal, ""); // não conseguiu comprimir — remove em vez de manter o original gigante
      continue;
    }

    if (bufferComprimido.length > LIMITE_BYTES_POR_IMAGEM) imagemGigante = true;
    bytesTotais += bufferComprimido.length;
    const dataUri = `data:image/jpeg;base64,${bufferComprimido.toString("base64")}`;
    imagens.push({ hash: hashBuffer(bufferComprimido), dataUri });
    html = html.replace(tagOriginal, `<img src="${dataUri}" alt="">`);
  }

  if (imagemGigante || bytesTotais > LIMITE_BYTES_TOTAL_IMAGENS) {
    const htmlSemImagens = htmlSemAltLocal.replace(/<img[^>]*>/g, "");
    return {
      html: htmlSemImagens,
      imagens: [],
      avisoImagens: `Imagens do .docx passam do limite de tamanho mesmo comprimidas (${(bytesTotais / 1024 / 1024).toFixed(1)}MB total) — extração pulada, revisar manualmente.`,
    };
  }

  return { html, imagens };
}

const anthropic = new Anthropic(); // lê ANTHROPIC_API_KEY do .env (carregado por config/env)

// Números "soltos" (isolados por espaço/quebra em ambos os lados) são
// números de página que o modelo tem permissão de descartar (ver prompt
// abaixo) — removidos dos dois textos antes de comparar. Qualquer outra
// divergência de caractere (uma letra/palavra diferente) ainda reprova a
// comparação — essa normalização nunca mascara alteração de conteúdo real.
function normalizarParaComparacao(texto) {
  return texto
    .replace(/(^|\s)\d+(?=\s|$)/g, " ") // números de página soltos
    .replace(/[“”]/g, '"') // aspas curvas duplas -> retas (diferença tipográfica, não de conteúdo)
    .replace(/[‘’]/g, "'") // aspas curvas simples -> retas
    .replace(/\s+/g, "");
}

const MARCADOR_IMAGEM = "[IMAGEM]";

// pdf-parse entrega texto posicional (por linha na página), sem distinguir
// quebra de linha por largura de coluna de quebra de parágrafo real, e não
// sabe em que ponto do texto cada imagem embutida estava. Usa um modelo com
// visão (Haiku 4.5 — tarefa não precisa de mais que isso) recebendo a
// própria página renderizada como imagem: (1) reorganiza as quebras de
// linha em parágrafos de verdade, descartando números de página soltos, e
// (2) insere o marcador [IMAGEM] no ponto exato do texto onde cada foto
// aparece na página, na ordem em que aparecem — Claude não consegue extrair
// o binário de uma imagem embutida (isso continua vindo do pdf-parse), só
// apontar a posição certa olhando a página.
//
// Nunca deixa o modelo alterar conteúdo de verdade: valida que o texto (sem
// espaços, sem números isolados, sem os marcadores) é idêntico antes/depois
// — se qualquer letra/palavra divergir (alucinação, correção não pedida),
// descarta a reformatação inteira e devolve o texto original sem
// posicionamento de imagem (fallback: imagens entram todas no fim da
// página, ver extrairPdf). Os marcadores de posição só são aceitos se a
// quantidade bater exatamente com o número de imagens extraídas da página
// — caso contrário também cai no mesmo fallback.
async function reformatarPaginaComImagens(textoBruto, bufferPagina, qtdImagensNaPagina) {
  if (!textoBruto.trim()) return { texto: textoBruto, marcadoresOk: false };

  const temImagens = bufferPagina && qtdImagensNaPagina > 0;
  const instrucaoImagem = temImagens
    ? ` A imagem em anexo é esta mesma página renderizada — use-a só pra identificar onde cada foto de conteúdo aparece (${qtdImagensNaPagina} no total nesta página); insira o marcador exato "${MARCADOR_IMAGEM}" no texto no ponto em que cada uma aparece, na ordem de cima pra baixo, com base na posição visual da foto em relação aos parágrafos ao redor dela na página — nem toda foto tem legenda, então não dependa de haver uma legenda pra posicionar o marcador; quando houver legenda, ela é só uma pista a mais. Não insira marcador para logos/cabeçalhos/rodapés decorativos que se repetem em todas as páginas do documento, só para fotos de conteúdo do trabalho em si.`
    : "";

  try {
    const conteudo = [];
    if (temImagens) {
      conteudo.push({
        type: "image",
        // bufferPagina (getScreenshot) é um Uint8Array puro, não Buffer do
        // Node — mesma pegadinha do imagem.data do pdf-parse (ver
        // extrairPdf); .toString("base64") direto no Uint8Array não gera
        // base64 de verdade.
        source: { type: "base64", media_type: "image/png", data: Buffer.from(bufferPagina).toString("base64") },
      });
    }
    conteudo.push({
      type: "text",
      text: `O texto abaixo foi extraído de um PDF — quebras de linha por largura de coluna ficaram misturadas com quebras de parágrafo reais, e números de página soltos ficaram misturados no meio do texto. Reorganize as quebras de linha: junte linhas que são continuação do mesmo parágrafo (sem quebra no meio), e separe parágrafos distintos (incluindo cada referência bibliográfica, quando houver uma lista delas) com uma linha em branco entre eles. Remova números de página isolados (um número sozinho, sem relação com a frase ao redor — nunca remova um número que faça parte do texto, como um ano ou uma quantidade).${instrucaoImagem} NÃO altere, adicione, corrija ortografia ou parafraseie NENHUMA palavra do texto original — preserve exatamente como está, só mude onde ficam as quebras de linha, remova os números de página soltos${temImagens ? " e insira os marcadores de imagem" : ""}. Responda só com o texto reformatado, sem nenhum comentário antes ou depois.\n\n---\n\n${textoBruto}`,
    });

    const resposta = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4000,
      messages: [{ role: "user", content: conteudo }],
    });

    const textoReformatado = resposta.content
      .filter((bloco) => bloco.type === "text")
      .map((bloco) => bloco.text)
      .join("");

    const semMarcadores = textoReformatado.split(MARCADOR_IMAGEM).join("");
    if (normalizarParaComparacao(semMarcadores) !== normalizarParaComparacao(textoBruto)) {
      console.log("    [aviso] reformatação de parágrafo descartada (texto divergiu) — usando extração original.");
      return { texto: textoBruto, marcadoresOk: false };
    }

    const qtdMarcadores = textoReformatado.split(MARCADOR_IMAGEM).length - 1;
    const marcadoresOk = temImagens && qtdMarcadores === qtdImagensNaPagina;
    if (temImagens && !marcadoresOk) {
      console.log(
        `    [aviso] marcadores de imagem não bateram (${qtdMarcadores} marcador(es) vs ${qtdImagensNaPagina} imagem(ns)) — imagens vão para o fim da página.`
      );
    }

    return { texto: textoReformatado, marcadoresOk };
  } catch (erro) {
    console.log(`    [aviso] falha ao chamar Claude pra reformatar página: ${erro.message} — usando extração original.`);
    return { texto: textoBruto, marcadoresOk: false };
  }
}

// Texto puro do PDF, agrupado em parágrafos (linha em branco = novo <p>) —
// pdf-parse não separa parágrafos de verdade, só linhas por posição na
// página.
function paragrafarTextoPdf(texto) {
  return texto
    .split(/\n\s*\n/)
    .map((bloco) =>
      bloco
        .split("\n")
        .map((linha) => linha.trim())
        .filter(Boolean)
        .join(" ")
    )
    .filter(Boolean)
    .map((paragrafo) => `<p>${paragrafo}</p>`)
    .join("");
}

// Acima disso não tenta nem extrair — um PDF com dezenas de imagens em alta
// resolução (visto em 1662203.pdf: 63 imagens, algumas 4000x4000+) estourou
// a memória do processo tentando manter tudo em base64 ao mesmo tempo. Bem
// acima do limite de negócio de 8/resumo (processarImagensEmbutidas.js) —
// serve só de proteção; documentos "normais" nunca chegam perto disso.
const LIMITE_SANIDADE_IMAGENS_PDF = 25;

// Substitui os marcadores [IMAGEM] (na ordem em que aparecem) pelas tags
// <img> reais — só chamada quando reformatarPaginaComImagens confirmou que
// a quantidade de marcadores bate com a quantidade de imagens da página.
// Um marcador sozinho em seu próprio <p> (caso mais comum — o modelo tende
// a colocar a foto como um "parágrafo" à parte) vira uma tag <img> solta;
// um marcador no meio de um parágrafo de texto vira uma <img> inline
// (menos comum, mas <img> dentro de <p> é HTML válido).
function substituirMarcadoresPorImagens(html, imagensDaPagina) {
  let indice = 0;
  const proximaImagem = () => imagensDaPagina[indice++];

  return html
    .replace(/<p>\s*\[IMAGEM\]\s*<\/p>/g, () => {
      const imagem = proximaImagem();
      return imagem ? `<img src="${imagem.dataUri}" alt="">` : "";
    })
    .replace(/\[IMAGEM\]/g, () => {
      const imagem = proximaImagem();
      return imagem ? `<img src="${imagem.dataUri}" alt="">` : "";
    });
}

// pdf-parse (via pdf.js por baixo) pode travar indefinidamente em getImage()
// pra certos PDFs (confirmado com 1734354.pdf: mais de 60s sem nunca
// resolver nem rejeitar) — sem essa proteção, o processo inteiro trava
// pra sempre numa única linha, sem log de erro nenhum. Timeout vira um
// erro normal, capturado no catch de indexarLinha, e o lote continua.
const TIMEOUT_OPERACAO_PDF_MS = 45_000;

function comTimeout(promise, ms, mensagem) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(mensagem)), ms)),
  ]);
}

async function extrairPdf(caminho) {
  const buffer = fs.readFileSync(caminho);
  const parser = new PDFParse({ data: buffer });

  const textoResult = await comTimeout(
    parser.getText(),
    TIMEOUT_OPERACAO_PDF_MS,
    "Timeout ao extrair texto do PDF (getText travou)."
  );
  const imagemResult = await comTimeout(
    parser.getImage(),
    TIMEOUT_OPERACAO_PDF_MS,
    "Timeout ao extrair imagens do PDF (getImage travou)."
  );

  const totalImagensNoDocumento = imagemResult.pages.reduce((acc, p) => acc + p.images.length, 0);

  if (totalImagensNoDocumento > LIMITE_SANIDADE_IMAGENS_PDF) {
    const textoPorPagina = [];
    for (const pagina of textoResult.pages) {
      const { texto } = await reformatarPaginaComImagens(pagina.text, null, 0);
      textoPorPagina.push(texto);
    }
    await parser.destroy();
    return {
      html: textoPorPagina.map((texto) => paragrafarTextoPdf(texto)).join(""),
      imagens: [],
      avisoImagens: `PDF com ${totalImagensNoDocumento} imagens (acima do limite de ${LIMITE_SANIDADE_IMAGENS_PDF}) — extração de imagem pulada, revisar manualmente.`,
    };
  }

  const imagensPorPagina = new Map();
  for (const pagina of imagemResult.pages) {
    imagensPorPagina.set(pagina.pageNumber, pagina.images);
  }

  // Cada imagem é comprimida (ver comprimirImagem) antes de entrar no HTML
  // — pdf-parse entrega pixels não comprimidos, bem maiores que o JPEG/PNG
  // original do documento.
  const imagens = [];
  const vistos = new Set(); // dedup global (ex. cabeçalho repetido em toda página) — mantém só a primeira ocorrência
  let bytesTotais = 0;
  let imagemGigante = false;
  let html = "";

  for (const pagina of textoResult.pages) {
    // Comprime e deduplica as imagens desta página primeiro — a contagem
    // final decide se dá pra confiar no posicionamento sugerido pelo modelo.
    const imagensDaPagina = [];
    for (const imagem of imagensPorPagina.get(pagina.num) || []) {
      if (!imagem.data) continue;
      // imagem.data é um Uint8Array puro (não Buffer do Node).
      const hash = hashBuffer(imagem.data);
      if (vistos.has(hash)) continue;
      vistos.add(hash);

      const bufferComprimido = await comprimirImagem(Buffer.from(imagem.data));
      if (!bufferComprimido) continue; // não conseguiu decodificar — pula só essa imagem

      if (bufferComprimido.length > LIMITE_BYTES_POR_IMAGEM) imagemGigante = true;
      bytesTotais += bufferComprimido.length;
      imagensDaPagina.push({ hash, dataUri: `data:image/jpeg;base64,${bufferComprimido.toString("base64")}` });
    }
    imagens.push(...imagensDaPagina);

    // Renderiza a página como imagem só quando há foto pra posicionar —
    // evita o custo/latência da chamada com visão em páginas só de texto.
    let screenshotPagina = null;
    if (imagensDaPagina.length > 0) {
      try {
        const resultadoScreenshot = await comTimeout(
          parser.getScreenshot({ scale: 1.5, partial: [pagina.num] }),
          TIMEOUT_OPERACAO_PDF_MS,
          "Timeout ao renderizar página do PDF (getScreenshot travou)."
        );
        screenshotPagina = resultadoScreenshot.pages[0]?.data || null;
      } catch {
        screenshotPagina = null; // sem screenshot — cai no fallback (imagem no fim da página)
      }
    }

    const { texto: textoReformatado, marcadoresOk } = await reformatarPaginaComImagens(
      pagina.text,
      screenshotPagina,
      imagensDaPagina.length
    );

    if (marcadoresOk) {
      html += substituirMarcadoresPorImagens(paragrafarTextoPdf(textoReformatado), imagensDaPagina);
    } else {
      html += paragrafarTextoPdf(textoReformatado);
      for (const imagem of imagensDaPagina) html += `<img src="${imagem.dataUri}" alt="">`;
    }
  }

  await parser.destroy();

  if (imagemGigante || bytesTotais > LIMITE_BYTES_TOTAL_IMAGENS) {
    return {
      html: html.replace(/<img[^>]*>/g, ""),
      imagens: [],
      avisoImagens: `Imagens do PDF passam do limite de tamanho mesmo comprimidas (${(bytesTotais / 1024 / 1024).toFixed(1)}MB total) — extração pulada, revisar manualmente.`,
    };
  }

  return { html, imagens };
}

async function extrairArquivo(caminho) {
  const ext = path.extname(caminho).toLowerCase();
  if (ext === ".docx") return extrairDocx(caminho);
  if (ext === ".pdf") return extrairPdf(caminho);
  throw new Error(`Extensão não suportada: "${ext}"`);
}

// Dedup por hash dentro do próprio arquivo (ex. um cabeçalho repetido em
// todas as páginas de um PDF vira 1 ocorrência só) — separado da dedup
// *entre* arquivos (ver identificarHashesTemplate), que cuida do
// logo/moldura do modelo comum a vários trabalhos.
function deduplicarImagens(imagens) {
  const vistos = new Set();
  return imagens.filter((imagem) => {
    if (vistos.has(imagem.hash)) return false;
    vistos.add(imagem.hash);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Filtragem de imagens de template + separação resumo/referência — via
// JSDOM (parser DOM real) em vez de regex, pra não perder blocos que uma
// regex simples não cobriria (ex. listas) e pra manipular o HTML com
// segurança.
// ---------------------------------------------------------------------------

function calcularHashDataUri(dataUri) {
  const base64 = (dataUri.split(",")[1] || "").trim();
  return hashBuffer(Buffer.from(base64, "base64"));
}

// Remove do HTML as <img> cujo conteúdo bate com um hash já identificado
// como template (logo/moldura repetida entre arquivos diferentes — ver
// identificarHashesTemplate) — o resto (texto, imagens exclusivas do
// documento) fica intacto.
function filtrarImagensTemplate(html, hashesTemplate) {
  const dom = new JSDOM(`<body>${html}</body>`);
  const imagens = Array.from(dom.window.document.querySelectorAll("img[src^='data:image/']"));
  let removidas = 0;

  for (const imagem of imagens) {
    const hash = calcularHashDataUri(imagem.getAttribute("src"));
    if (hashesTemplate.has(hash)) {
      imagem.remove();
      removidas++;
    }
  }

  return { html: dom.window.document.body.innerHTML, removidas };
}

// Maiúsculas sem case-insensitive de propósito: nos documentos de origem
// "RESUMO"/"REFERÊNCIAS" são cabeçalhos de seção em caixa alta, enquanto a
// palavra aparece de novo em uso normal dentro do próprio texto ("o
// presente resumo apresenta...", sempre em minúsculas) — buscar
// case-insensitive bateria errado na primeira ocorrência útil.
const MARCADOR_RESUMO = /\bRESUMO\b\s*:?\s*/;
const MARCADOR_REFERENCIAS = /\bREFER[EÊ]NCIAS?(\s+BIBLIOGR[AÁ]FICAS?)?\b\s*:?\s*/;

function escaparHtml(texto) {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// A palavra-marcador não fica isolada no próprio parágrafo — normalmente
// vem grudada no mesmo bloco do que veio antes (fim da lista de autores) e
// do que vem depois (início do texto de verdade), efeito comum de como
// pdf-parse/mammoth juntam linhas sem uma quebra clara no documento
// original. Por isso busca a palavra DENTRO do texto de cada bloco, não um
// bloco inteiro que seja só a palavra.
function localizarMarcadorEmBlocos(blocos, regex) {
  for (let indice = 0; indice < blocos.length; indice++) {
    if (blocos[indice].tagName === "IMG") continue;
    const texto = blocos[indice].textContent;
    const match = regex.exec(texto);
    if (match) {
      return { indice, textoDepois: texto.slice(match.index + match[0].length).trim() };
    }
  }
  return null;
}

// Corta tudo antes de "RESUMO" (número da sessão, título, lista de
// autores/e-mails) e tudo depois de "REFERÊNCIAS" fica só nesse campo — o
// que sobra no meio é o resumo de verdade. Sem os marcadores, mantém o
// texto inteiro como resumo (nunca adivinha onde cortar).
function separarResumoEReferencia(html) {
  const dom = new JSDOM(`<body>${html}</body>`);
  const blocos = Array.from(dom.window.document.body.children);

  const marcadorResumo = localizarMarcadorEmBlocos(blocos, MARCADOR_RESUMO);
  let blocosCorpo = blocos;
  if (marcadorResumo) {
    const blocosDepois = blocos.slice(marcadorResumo.indice + 1);
    blocosCorpo = marcadorResumo.textoDepois
      ? [{ tagName: "P", outerHTML: `<p>${escaparHtml(marcadorResumo.textoDepois)}</p>` }, ...blocosDepois]
      : blocosDepois;
  }

  const marcadorReferencias = localizarMarcadorEmBlocos(blocosCorpo, MARCADOR_REFERENCIAS);
  if (!marcadorReferencias) {
    return { resumo: blocosCorpo.map((bloco) => bloco.outerHTML).join(""), referencia: "" };
  }

  const resumo = blocosCorpo
    .slice(0, marcadorReferencias.indice)
    .map((bloco) => bloco.outerHTML)
    .join("");
  // Referência só permite <strong>/<p>/<br> (ver sanitizarReferenciaBibliografica.js) —
  // imagens que sobrarem depois do marcador ficam de fora desse campo.
  const blocosReferenciaDepois = blocosCorpo
    .slice(marcadorReferencias.indice + 1)
    .filter((bloco) => bloco.tagName !== "IMG");
  const referencia =
    (marcadorReferencias.textoDepois ? `<p>${escaparHtml(marcadorReferencias.textoDepois)}</p>` : "") +
    blocosReferenciaDepois.map((bloco) => bloco.outerHTML).join("");

  return { resumo, referencia };
}

// ---------------------------------------------------------------------------
// Autores
// ---------------------------------------------------------------------------

function parsearAutores(autoresRaw, emailsRaw) {
  const nomes = (autoresRaw || "").split(",").map((n) => n.trim()).filter(Boolean);
  const emails = (emailsRaw || "").split(",").map((e) => e.trim()).filter(Boolean);

  if (nomes.length !== emails.length || nomes.length === 0) return null;

  return nomes.map((nome, indice) => ({ nome, email: emails[indice] }));
}

// ---------------------------------------------------------------------------
// Fase A — indexação (download + extração + hashes de template)
// ---------------------------------------------------------------------------

async function indexarLinha(linha, pastaDownloads, pastaExtraido) {
  const numero = String(linha["Número"]);
  const destinoJson = path.join(pastaExtraido, `${numero}.json`);
  if (fs.existsSync(destinoJson)) {
    return JSON.parse(fs.readFileSync(destinoJson, "utf8"));
  }

  const linkTrabalho = linha["Link Trabalho"];
  const url = linha["URL"];
  if (!linkTrabalho || !url) {
    const resultado = { erro: "Sem link/URL de trabalho na planilha." };
    fs.writeFileSync(destinoJson, JSON.stringify(resultado, null, 2));
    return resultado;
  }

  try {
    const caminhoArquivo = await resolverArquivoLocal({ numero, linkTrabalho, url, pastaDownloads });
    const { html, imagens, avisoImagens } = await extrairArquivo(caminhoArquivo);
    const imagensUnicas = deduplicarImagens(imagens);
    const resultado = avisoImagens ? { html, imagens: imagensUnicas, avisoImagens } : { html, imagens: imagensUnicas };
    fs.writeFileSync(destinoJson, JSON.stringify(resultado, null, 2));
    return resultado;
  } catch (erro) {
    const resultado = { erro: erro.message };
    fs.writeFileSync(destinoJson, JSON.stringify(resultado, null, 2));
    return resultado;
  }
}

function identificarHashesTemplate(indice) {
  const arquivosPorHash = new Map();

  for (const [numero, resultado] of indice) {
    if (resultado.erro) continue;
    for (const imagem of resultado.imagens) {
      if (!arquivosPorHash.has(imagem.hash)) arquivosPorHash.set(imagem.hash, new Set());
      arquivosPorHash.get(imagem.hash).add(numero);
    }
  }

  const hashesTemplate = new Map();
  for (const [hash, arquivos] of arquivosPorHash) {
    if (arquivos.size > 1) hashesTemplate.set(hash, arquivos.size);
  }
  return hashesTemplate;
}

// ---------------------------------------------------------------------------
// Fase B — criação das submissões
// ---------------------------------------------------------------------------

async function resolverUsuarioPrincipal(nome, email) {
  const existente = await prisma.usuario.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existente) return existente;

  return usuariosService.criarUsuarioViaSubmissao({ nome, email });
}

async function montarAutores(autoresParsed, usuarioPrincipal) {
  const autores = [
    {
      nome: usuarioPrincipal.nome,
      email: usuarioPrincipal.email,
      orcid: null,
      usuarioId: usuarioPrincipal.id,
      principal: true,
      ordem: 0,
    },
  ];

  for (let indice = 1; indice < autoresParsed.length; indice++) {
    const { nome, email } = autoresParsed[indice];
    const usuarioExistente = await prisma.usuario.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    autores.push({
      nome: usuarioExistente?.nome || nome,
      email,
      orcid: null,
      usuarioId: usuarioExistente?.id || null,
      principal: false,
      ordem: indice,
    });
  }

  return autores;
}

async function processarLinha({ linha, modalidadeId, areaId, resultadoExtracao, hashesTemplate, dryRun, relatorio }) {
  const numero = String(linha["Número"]);
  const titulo = (linha["Título"] || "").trim();

  if (!titulo) {
    relatorio.pulados.push({ numero, motivo: "Sem título." });
    return;
  }

  const autoresParsed = parsearAutores(linha["Autores"], linha["Emails"]);
  if (!autoresParsed) {
    relatorio.pulados.push({ numero, motivo: "Autores/Emails com contagens diferentes ou vazios." });
    return;
  }

  if (resultadoExtracao.erro) {
    relatorio.falhas.push({ numero, titulo, motivo: resultadoExtracao.erro });
    return;
  }

  // Documento com imagens demais pra processar com segurança (ver
  // LIMITE_SANIDADE_IMAGENS_PDF) — não cria automaticamente sem elas, já
  // que migrar as imagens é requisito; fica pra revisão/importação manual.
  if (resultadoExtracao.avisoImagens) {
    relatorio.falhas.push({ numero, titulo, motivo: resultadoExtracao.avisoImagens });
    return;
  }

  // resultadoExtracao.html já vem com as imagens embutidas (mammoth: na
  // posição correta; pdf-parse: anexadas ao final) — aqui só remove as que
  // batem com hash de template, sem reinserir nada.
  const { html: htmlSemTemplate, removidas: qtdImagensDescartadasPorTemplate } = filtrarImagensTemplate(
    resultadoExtracao.html,
    hashesTemplate
  );

  const { resumo: resumoBruto, referencia: referenciaBruta } = separarResumoEReferencia(htmlSemTemplate);

  let resumoSanitizado;
  let referenciaSanitizada;
  try {
    resumoSanitizado = sanitizarResumoSubmissao(resumoBruto);
    referenciaSanitizada = sanitizarReferenciaBibliografica(referenciaBruta);
  } catch (erro) {
    relatorio.falhas.push({ numero, titulo, motivo: `Sanitização: ${erro.message}` });
    return;
  }

  const [dia, mes, ano] = String(linha["Data da submissão"]).split("/");
  const createdAt = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));

  if (dryRun) {
    relatorio.previews.push({
      numero,
      titulo,
      autorPrincipal: autoresParsed[0],
      tamanhoResumo: resumoSanitizado.length,
      inicioResumo: resumoSanitizado.replace(/<[^>]+>/g, "").slice(0, 200),
      tamanhoReferencia: referenciaSanitizada.length,
      inicioReferencia: referenciaSanitizada.replace(/<[^>]+>/g, "").slice(0, 200),
      qtdImagens: (resumoSanitizado.match(/<img /g) || []).length,
      qtdImagensDescartadasPorTemplate,
    });
    return;
  }

  try {
    const usuarioPrincipal = await resolverUsuarioPrincipal(autoresParsed[0].nome, autoresParsed[0].email);

    const existente = await prisma.submissao.findFirst({
      where: { usuarioId: usuarioPrincipal.id, modalidadeSubmissaoId: modalidadeId.id, titulo },
    });
    if (existente) {
      relatorio.jaImportados.push({ numero, titulo });
      return;
    }

    // processarImagensEmbutidas lança se passar de 8 imagens (limite do
    // próprio backend) — capturado abaixo, pra não abortar o lote inteiro
    // por causa de um documento com muitas fotos.
    const resumoComGcs = await processarImagensEmbutidas(resumoSanitizado, "submissoes-resumo");
    const autores = await montarAutores(autoresParsed, usuarioPrincipal);

    const submissao = await prisma.submissao.create({
      data: {
        edicaoId: modalidadeId.edicaoId,
        modalidadeSubmissaoId: modalidadeId.id,
        areaSubmissaoId: areaId,
        titulo,
        resumo: resumoComGcs,
        referenciaBibliografica: referenciaSanitizada,
        usuarioId: usuarioPrincipal.id,
        autores: { create: autores },
        createdAt,
      },
    });

    relatorio.criados.push({ numero, titulo, submissaoId: submissao.id });
  } catch (erro) {
    relatorio.falhas.push({ numero, titulo, motivo: `Criação: ${erro.message}` });
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  const args = lerArgs();
  console.log("Argumentos:", args);

  if (!fs.existsSync(args.arquivo)) {
    throw new Error(`Arquivo não encontrado: ${args.arquivo}`);
  }

  const pastaDownloads = path.join(args.cache, "downloads");
  const pastaExtraido = path.join(args.cache, "extraido");
  fs.mkdirSync(pastaDownloads, { recursive: true });
  fs.mkdirSync(pastaExtraido, { recursive: true });

  const edicao = await prisma.edicao.findUnique({ where: { id: args.edicaoId } });
  if (!edicao) throw new Error(`Edição não encontrada: ${args.edicaoId}`);

  const workbook = XLSX.readFile(args.arquivo);
  const linhasComAba = [];
  for (const nomeAba of workbook.SheetNames) {
    if (nomeAba === "Geral") continue;
    const mapeamento = resolverModalidadeEArea(nomeAba);
    if (!mapeamento) continue;

    const linhas = XLSX.utils.sheet_to_json(workbook.Sheets[nomeAba], { defval: null });
    for (const linha of linhas) linhasComAba.push({ linha, nomeAba, mapeamento });
  }

  const linhasParaProcessar = args.limite ? linhasComAba.slice(0, args.limite) : linhasComAba;
  console.log(`Linhas a processar: ${linhasParaProcessar.length} de ${linhasComAba.length} no total.`);

  // Resolve modalidade/área reais no banco (uma vez, por slug).
  const modalidadesCache = new Map();
  async function resolverModalidade(slug) {
    if (!modalidadesCache.has(slug)) {
      const modalidade = await prisma.modalidadeSubmissao.findFirst({
        where: { edicaoId: args.edicaoId, slug },
        include: { areas: true },
      });
      if (!modalidade) throw new Error(`Modalidade "${slug}" não encontrada na edição ${args.edicaoId}.`);
      modalidadesCache.set(slug, modalidade);
    }
    return modalidadesCache.get(slug);
  }

  // -------------------------------------------------------------------
  // Fase A — indexação
  // -------------------------------------------------------------------
  const indice = new Map();
  if (!args.pularIndexacao) {
    console.log("\n=== Fase A: baixando e extraindo arquivos ===");
    let contador = 0;
    for (const { linha } of linhasParaProcessar) {
      contador++;
      const numero = String(linha["Número"]);
      process.stdout.write(`  [${contador}/${linhasParaProcessar.length}] ${numero}... `);
      const resultado = await indexarLinha(linha, pastaDownloads, pastaExtraido);
      indice.set(numero, resultado);
      if (resultado.erro) console.log(`ERRO: ${resultado.erro}`);
      else if (resultado.avisoImagens) console.log(`AVISO: ${resultado.avisoImagens}`);
      else console.log(`ok (${resultado.imagens.length} imagens)`);
    }
  } else {
    console.log("\n=== Fase A pulada (--pular-indexacao) — lendo cache existente ===");
    for (const { linha } of linhasParaProcessar) {
      const numero = String(linha["Número"]);
      const destinoJson = path.join(pastaExtraido, `${numero}.json`);
      if (fs.existsSync(destinoJson)) {
        indice.set(numero, JSON.parse(fs.readFileSync(destinoJson, "utf8")));
      } else {
        indice.set(numero, { erro: "Sem cache de extração (rode sem --pular-indexacao pelo menos uma vez)." });
      }
    }
  }

  const hashesTemplate = identificarHashesTemplate(indice);
  console.log(`\nImagens identificadas como template (aparecem em mais de 1 arquivo): ${hashesTemplate.size}`);
  for (const [hash, qtd] of hashesTemplate) {
    console.log(`  hash ${hash.slice(0, 12)}... aparece em ${qtd} arquivos`);
  }

  // -------------------------------------------------------------------
  // Fase B — criação
  // -------------------------------------------------------------------
  console.log(`\n=== Fase B: ${args.dryRun ? "dry-run (preview)" : "criando submissões"} ===`);
  const relatorio = { criados: [], jaImportados: [], pulados: [], falhas: [], previews: [] };

  for (const { linha, nomeAba, mapeamento } of linhasParaProcessar) {
    const numero = String(linha["Número"]);
    const resultadoExtracao = indice.get(numero);

    const modalidade = await resolverModalidade(mapeamento.modalidadeSlug);
    const area = mapeamento.areaSlug ? modalidade.areas.find((a) => a.slug === mapeamento.areaSlug) : null;
    if (mapeamento.areaSlug && !area) {
      relatorio.falhas.push({ numero, titulo: linha["Título"], motivo: `Área "${mapeamento.areaSlug}" não encontrada.` });
      continue;
    }

    await processarLinha({
      linha,
      modalidadeId: { id: modalidade.id, edicaoId: args.edicaoId },
      areaId: area ? area.id : null,
      resultadoExtracao,
      hashesTemplate,
      dryRun: args.dryRun,
      relatorio,
    });

    // Libera o HTML/imagens dessa linha assim que processada — mantê-las
    // todas em memória por causa do índice inteiro (601 linhas em produção)
    // é o que estourava a heap antes das travas de tamanho acima.
    indice.delete(numero);
  }

  console.log("\n=== Resumo ===");
  console.log(`Criados: ${relatorio.criados.length}`);
  console.log(`Já importados (pulados): ${relatorio.jaImportados.length}`);
  console.log(`Pulados (dados inválidos): ${relatorio.pulados.length}`);
  console.log(`Falhas: ${relatorio.falhas.length}`);
  if (relatorio.falhas.length > 0) {
    console.log("Detalhe das falhas:");
    relatorio.falhas.forEach((f) => console.log(`  ${f.numero} — ${f.titulo} — ${f.motivo}`));
  }
  if (args.dryRun) {
    console.log("\nPrévias:");
    relatorio.previews.forEach((p) => {
      console.log(`\n[${p.numero}] ${p.titulo}`);
      console.log(`  Autor principal: ${p.autorPrincipal.nome} <${p.autorPrincipal.email}>`);
      console.log(`  Resumo (${p.tamanhoResumo} chars): ${p.inicioResumo}...`);
      console.log(`  Referência (${p.tamanhoReferencia} chars): ${p.inicioReferencia}...`);
      console.log(`  Imagens: ${p.qtdImagens} (${p.qtdImagensDescartadasPorTemplate} descartadas por template)`);
    });
  }
}

// Rede de segurança: sem isso, um erro assíncrono que escapa de qualquer
// try/catch (ex. dentro de uma lib de terceiro) mata o processo sem deixar
// rastro no log — foi exatamente o que aconteceu num run de 604 linhas que
// parou sozinho na linha 129 sem nenhuma mensagem de erro.
process.on("unhandledRejection", (erro) => {
  console.error("Rejeição não tratada:", erro);
  process.exitCode = 1;
});
process.on("uncaughtException", (erro) => {
  console.error("Exceção não capturada:", erro);
  process.exitCode = 1;
});

main()
  .catch((erro) => {
    console.error("Erro na importação:", erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
