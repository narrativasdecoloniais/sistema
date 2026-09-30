const fs = require("fs");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const { JSDOM } = require("jsdom");
const { substituirMarcadores } = require("../utils/marcadoresCertificado");

// Desenha um certificado (A4 paisagem, só frente): imagem de fundo cobrindo a
// página, texto do modelo dentro da caixa definida pelas margens e QR code de
// validação num dos cantos. Puro — recebe o fundo já carregado e os valores
// dos marcadores; quem busca dados/arquivos é certificados.service.js.

const MM = 72 / 25.4;
const LARGURA_PAGINA = 297 * MM;
const ALTURA_PAGINA = 210 * MM;
// Parágrafos separados por meia linha — mesmo valor da prévia HTML do admin
// (PreviaCertificado.module.scss).
const ESPACO_PARAGRAFO_EM = 0.5;
// Se o texto não couber na caixa, a fonte vai diminuindo até este limite.
const TAMANHO_MINIMO_FONTE = 6;
const TAMANHO_ROTULO_QR = 7;

// Archivo (fonte do site) vem embutida via @fontsource (WOFF, lido pelo
// fontkit do pdfkit); Times e Helvetica são as fontes padrão do PDF.
function arquivoArchivo(peso, estilo) {
  return require.resolve(`@fontsource/archivo/files/archivo-latin-${peso}-${estilo}.woff`);
}

let buffersArchivo = null;
function carregarArchivo() {
  if (!buffersArchivo) {
    buffersArchivo = {
      normal: fs.readFileSync(arquivoArchivo(400, "normal")),
      negrito: fs.readFileSync(arquivoArchivo(700, "normal")),
      italico: fs.readFileSync(arquivoArchivo(400, "italic")),
      negritoItalico: fs.readFileSync(arquivoArchivo(700, "italic")),
    };
  }
  return buffersArchivo;
}

const FONTES_PADRAO = {
  TIMES: { normal: "Times-Roman", negrito: "Times-Bold", italico: "Times-Italic", negritoItalico: "Times-BoldItalic" },
  HELVETICA: {
    normal: "Helvetica",
    negrito: "Helvetica-Bold",
    italico: "Helvetica-Oblique",
    negritoItalico: "Helvetica-BoldOblique",
  },
};

// Registra as variantes da família no documento e devolve os nomes.
function registrarFontes(doc, familia) {
  if (familia !== "ARCHIVO") return FONTES_PADRAO[familia] || FONTES_PADRAO.HELVETICA;
  const arquivos = carregarArchivo();
  const nomes = {};
  for (const [variante, buffer] of Object.entries(arquivos)) {
    const nome = `Archivo-${variante}`;
    doc.registerFont(nome, buffer);
    nomes[variante] = nome;
  }
  return nomes;
}

function fonteDoTrecho(fontes, trecho) {
  if (trecho.negrito && trecho.italico) return fontes.negritoItalico;
  if (trecho.negrito) return fontes.negrito;
  if (trecho.italico) return fontes.italico;
  return fontes.normal;
}

// ---------------------------------------------------------------------------
// HTML (p/br/strong/em, já sanitizado) -> parágrafos de trechos
// ---------------------------------------------------------------------------

const janela = new JSDOM("").window;

function extrairParagrafos(html, valores) {
  const raiz = janela.document.createElement("div");
  raiz.innerHTML = html || "";
  const paragrafos = [];
  let soltos = null; // texto fora de <p> vira um parágrafo implícito

  function coletar(no, estilo, trechos) {
    if (no.nodeType === 3) {
      const texto = substituirMarcadores(no.textContent, valores);
      if (texto) trechos.push({ texto, ...estilo });
      return;
    }
    if (no.nodeType !== 1) return;
    const tag = no.tagName;
    if (tag === "BR") {
      trechos.push({ texto: "\n", ...estilo });
      return;
    }
    const novo = {
      negrito: estilo.negrito || tag === "STRONG" || tag === "B",
      italico: estilo.italico || tag === "EM" || tag === "I",
    };
    no.childNodes.forEach((filho) => coletar(filho, novo, trechos));
  }

  raiz.childNodes.forEach((no) => {
    if (no.nodeType === 1 && no.tagName === "P") {
      soltos = null;
      const trechos = [];
      coletar(no, { negrito: false, italico: false }, trechos);
      paragrafos.push(trechos);
    } else {
      if (!soltos) {
        soltos = [];
        paragrafos.push(soltos);
      }
      coletar(no, { negrito: false, italico: false }, soltos);
    }
  });

  // Espaços do HTML que o navegador colapsaria.
  return paragrafos.map((trechos) =>
    trechos
      .map((trecho) => (trecho.texto === "\n" ? trecho : { ...trecho, texto: trecho.texto.replace(/\s+/g, " ") }))
      .filter((trecho) => trecho.texto !== "")
  );
}

// ---------------------------------------------------------------------------
// Layout próprio: o `continued` do pdfkit não alinha direito trechos com
// fontes diferentes (centralizado/justificado se sobrepõem e espaço no início
// de um trecho some), então a quebra de linha e o alinhamento são calculados
// aqui, palavra a palavra, e cada pedaço é desenhado na posição exata.
// ---------------------------------------------------------------------------

// Parágrafo -> linhas de palavras; cada palavra é uma lista de pedaços com
// estilo (ex. "<strong>Ana</strong>," = "Ana" negrito + "," normal).
function quebrarLinhas(doc, trechos, { fontes, tamanho, largura }) {
  const medir = (pedaco) => doc.font(fonteDoTrecho(fontes, pedaco)).fontSize(tamanho).widthOfString(pedaco.texto);
  const espaco = doc.font(fontes.normal).fontSize(tamanho).widthOfString(" ");

  // Sequência de palavras e quebras forçadas (<br>).
  const itens = [];
  let palavra = null;
  const fecharPalavra = () => {
    if (palavra) itens.push(palavra);
    palavra = null;
  };
  for (const trecho of trechos) {
    if (trecho.texto === "\n") {
      fecharPalavra();
      itens.push({ quebra: true });
      continue;
    }
    for (const parte of trecho.texto.split(/(\s+)/)) {
      if (!parte) continue;
      if (/^\s+$/.test(parte)) {
        fecharPalavra();
        continue;
      }
      const pedaco = { texto: parte, negrito: trecho.negrito, italico: trecho.italico };
      pedaco.largura = medir(pedaco);
      if (!palavra) palavra = { pedacos: [], largura: 0 };
      palavra.pedacos.push(pedaco);
      palavra.largura += pedaco.largura;
    }
  }
  fecharPalavra();

  // Palavra mais larga que a linha (ex. URL) é partida por caractere.
  const partirPalavra = (p) => {
    const partes = [];
    let atual = { pedacos: [], largura: 0 };
    for (const pedaco of p.pedacos) {
      for (const caractere of Array.from(pedaco.texto)) {
        const c = { texto: caractere, negrito: pedaco.negrito, italico: pedaco.italico };
        c.largura = medir(c);
        if (atual.largura + c.largura > largura && atual.pedacos.length > 0) {
          partes.push(atual);
          atual = { pedacos: [], largura: 0 };
        }
        atual.pedacos.push(c);
        atual.largura += c.largura;
      }
    }
    if (atual.pedacos.length > 0) partes.push(atual);
    return partes;
  };

  const linhas = [];
  let linha = { palavras: [], largura: 0, forcada: false };
  const fecharLinha = (forcada) => {
    linha.forcada = forcada;
    linhas.push(linha);
    linha = { palavras: [], largura: 0, forcada: false };
  };
  for (const item of itens) {
    if (item.quebra) {
      fecharLinha(true);
      continue;
    }
    const partes = item.largura > largura ? partirPalavra(item) : [item];
    for (const p of partes) {
      const acrescimo = (linha.palavras.length > 0 ? espaco : 0) + p.largura;
      if (linha.palavras.length > 0 && linha.largura + acrescimo > largura) fecharLinha(false);
      linha.largura += (linha.palavras.length > 0 ? espaco : 0) + p.largura;
      linha.palavras.push(p);
    }
  }
  fecharLinha(true);
  return { linhas, espaco };
}

function diagramar(doc, paragrafos, parametros) {
  return paragrafos.map((trechos) => quebrarLinhas(doc, trechos, parametros));
}

function alturaDiagramada(diagramados, { tamanho, entrelinha }) {
  const linhas = diagramados.reduce((total, p) => total + p.linhas.length, 0);
  return linhas * tamanho * entrelinha + Math.max(0, diagramados.length - 1) * tamanho * ESPACO_PARAGRAFO_EM;
}

// Mesmo modelo do CSS: cada linha ocupa tamanho × entrelinha e o texto fica
// centralizado verticalmente nela (half-leading).
function desenharDiagramados(doc, diagramados, { fontes, x, y, largura, tamanho, entrelinha, alinhamento }) {
  const alturaLinha = tamanho * entrelinha;
  const alturaNatural = doc.font(fontes.normal).fontSize(tamanho).currentLineHeight();
  const meioEntrelinha = (alturaLinha - alturaNatural) / 2;

  let cursor = y;
  diagramados.forEach(({ linhas, espaco }, indice) => {
    if (indice > 0) cursor += tamanho * ESPACO_PARAGRAFO_EM;
    for (const linha of linhas) {
      const sobra = largura - linha.largura;
      const lacunas = linha.palavras.length - 1;
      const justificar = alinhamento === "JUSTIFICADO" && !linha.forcada && lacunas > 0;
      let xAtual = x;
      if (alinhamento === "CENTRO") xAtual += sobra / 2;
      else if (alinhamento === "DIREITA") xAtual += sobra;
      const espacoEntre = justificar ? espaco + sobra / lacunas : espaco;

      linha.palavras.forEach((palavra) => {
        for (const pedaco of palavra.pedacos) {
          doc
            .font(fonteDoTrecho(fontes, pedaco))
            .fontSize(tamanho)
            .text(pedaco.texto, xAtual, cursor + meioEntrelinha, { lineBreak: false });
          xAtual += pedaco.largura;
        }
        xAtual += espacoEntre;
      });
      cursor += alturaLinha;
    }
  });
  return cursor;
}

// ---------------------------------------------------------------------------
// QR code
// ---------------------------------------------------------------------------

function desenharQr(doc, { imagemQr, posicao, tamanho, margem, codigo, fontes }) {
  const lado = tamanho * MM;
  const afastamento = margem * MM;
  const larguraRotulo = Math.max(lado, 120);
  const alturaRotulo = TAMANHO_ROTULO_QR * 2.6;
  const direita = posicao.endsWith("DIREITO");
  const inferior = posicao.startsWith("INFERIOR");

  const xQr = direita ? LARGURA_PAGINA - afastamento - lado : afastamento;
  const yQr = inferior ? ALTURA_PAGINA - afastamento - alturaRotulo - lado : afastamento;
  doc.image(imagemQr, xQr, yQr, { width: lado, height: lado });

  // Rótulo encostado no mesmo lado do QR, pra nunca sair da página.
  const xRotulo = direita ? xQr + lado - larguraRotulo : xQr;
  doc
    .fillColor("#2B2622")
    .font(fontes.normal)
    .fontSize(TAMANHO_ROTULO_QR)
    .text("Código de validação", xRotulo, yQr + lado + 2, {
      width: larguraRotulo,
      align: direita ? "right" : "left",
      lineBreak: false,
    })
    .font(fontes.negrito)
    .text(codigo, xRotulo, doc.y, { width: larguraRotulo, align: direita ? "right" : "left", lineBreak: false });
}

// ---------------------------------------------------------------------------
// Documento
// ---------------------------------------------------------------------------

async function gerarPdfCertificado({ modelo, valores, codigo, urlValidacao, imagemFundo, titulo }) {
  const doc = new PDFDocument({
    size: [LARGURA_PAGINA, ALTURA_PAGINA],
    margin: 0,
    info: { Title: titulo || "Certificado", Author: "Narrativas Interculturais, Decoloniais e Antirracistas em Educação" },
  });
  const partes = [];
  doc.on("data", (parte) => partes.push(parte));
  const terminou = new Promise((resolver, rejeitar) => {
    doc.on("end", () => resolver(Buffer.concat(partes)));
    doc.on("error", rejeitar);
  });

  if (imagemFundo) {
    doc.image(imagemFundo, 0, 0, { cover: [LARGURA_PAGINA, ALTURA_PAGINA], align: "center", valign: "center" });
  }

  const fontes = registrarFontes(doc, modelo.fonte);
  const x = modelo.margemEsquerda * MM;
  const topo = modelo.margemSuperior * MM;
  const largura = Math.max(20, LARGURA_PAGINA - (modelo.margemEsquerda + modelo.margemDireita) * MM);
  const alturaCaixa = Math.max(20, ALTURA_PAGINA - (modelo.margemSuperior + modelo.margemInferior) * MM);
  const paragrafos = extrairParagrafos(modelo.texto, valores);

  // Reduz a fonte em passos de 0,5 pt até o texto caber na caixa.
  let tamanho = modelo.tamanhoFonte;
  const parametros = () => ({
    fontes,
    largura,
    tamanho,
    entrelinha: modelo.entrelinha,
    alinhamento: modelo.alinhamento,
  });
  let diagramados = diagramar(doc, paragrafos, parametros());
  while (alturaDiagramada(diagramados, parametros()) > alturaCaixa && tamanho > TAMANHO_MINIMO_FONTE) {
    tamanho = Math.max(TAMANHO_MINIMO_FONTE, tamanho - 0.5);
    diagramados = diagramar(doc, paragrafos, parametros());
  }
  const altura = alturaDiagramada(diagramados, parametros());

  const y = modelo.alinhamentoVertical === "CENTRO" ? topo + Math.max(0, (alturaCaixa - altura) / 2) : topo;
  doc.fillColor(modelo.corTexto || "#2B2622");
  desenharDiagramados(doc, diagramados, { ...parametros(), x, y });

  const imagemQr = await QRCode.toBuffer(urlValidacao, { type: "png", margin: 1, width: 512, errorCorrectionLevel: "M" });
  desenharQr(doc, {
    imagemQr,
    posicao: modelo.posicaoQr,
    tamanho: modelo.tamanhoQr,
    margem: modelo.margemQr,
    codigo,
    fontes,
  });

  doc.end();
  return terminou;
}

module.exports = { gerarPdfCertificado };
