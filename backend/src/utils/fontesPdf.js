const path = require("path");
const fontkit = require("fontkit");

// Fontes dos PDFs dos Anais (pdfmake) com cobertura de caracteres.
//
// O @fontsource distribui cada fonte fatiada por alfabeto (latin, latin-ext,
// vietnamese, greek, cyrillic…), e o pdfmake não tem fonte reserva: um
// caractere fora do arquivo usado derruba a geração inteira ("Offset is
// outside the bounds of the DataView", no fontkit). Os trabalhos trazem
// ũ/ẽ/ĩ (línguas indígenas), ọ/ẹ/ṣ (iorubá), ě, ł, setas, marcas
// combinantes… Então cada fatia vira uma família própria no pdfmake e, antes
// de desenhar, aplicarFontes() quebra cada texto em trechos com a fatia que
// tem cada caractere (mesma fonte, mesma aparência). O que nenhuma fatia
// cobre (setas, símbolos) cai na DejaVu Sans, e o que nem ela tem sai do
// texto — nunca derruba o arquivo.

function arquivoFontsource(pacote, arquivo) {
  return require.resolve(`@fontsource/${pacote}/files/${arquivo}`);
}

function familiaFontsource(pacote, subconjunto, { soRegular = false } = {}) {
  const arquivo = (peso, estilo) => arquivoFontsource(pacote, `${pacote}-${subconjunto}-${peso}-${estilo}.woff`);
  if (soRegular) {
    const regular = arquivo(400, "normal");
    return { normal: regular, bold: regular, italics: regular, bolditalics: regular };
  }
  return {
    normal: arquivo(400, "normal"),
    bold: arquivo(700, "normal"),
    italics: arquivo(400, "italic"),
    bolditalics: arquivo(700, "italic"),
  };
}

// Família base → pacote e fatias, na ordem de preferência.
const BASES = {
  Archivo: { pacote: "archivo", subconjuntos: ["latin", "latin-ext", "vietnamese"] },
  Serif: {
    pacote: "source-serif-4",
    subconjuntos: ["latin", "latin-ext", "vietnamese", "greek", "cyrillic", "cyrillic-ext"],
  },
  Stencil: { pacote: "saira-stencil-one", subconjuntos: ["latin", "latin-ext", "vietnamese"], soRegular: true },
};

const RESERVA = "DejaVu";
const arquivoDejaVu = (nome) => require.resolve(`dejavu-fonts-ttf/ttf/${nome}`);

// Nome da família no pdfmake: a fatia latin fica com o nome da base.
function nomeFamilia(base, subconjunto) {
  return subconjunto === "latin" ? base : `${base}__${subconjunto}`;
}

const FONTES = {
  [RESERVA]: {
    normal: arquivoDejaVu("DejaVuSans.ttf"),
    bold: arquivoDejaVu("DejaVuSans-Bold.ttf"),
    italics: arquivoDejaVu("DejaVuSans-Oblique.ttf"),
    bolditalics: arquivoDejaVu("DejaVuSans-BoldOblique.ttf"),
  },
};
for (const [base, { pacote, subconjuntos, soRegular }] of Object.entries(BASES)) {
  for (const subconjunto of subconjuntos) {
    FONTES[nomeFamilia(base, subconjunto)] = familiaFontsource(pacote, subconjunto, { soRegular });
  }
}

const PASTAS_FONTES = [...new Set(Object.values(FONTES).flatMap((familia) => Object.values(familia).map(path.dirname)))];

// Cobertura medida no arquivo regular de cada família (as fatias têm o mesmo
// recorte de caracteres em todos os pesos).
const coberturas = new Map();
function cobre(familia, codigo) {
  if (!coberturas.has(familia)) {
    coberturas.set(familia, { fonte: fontkit.openSync(FONTES[familia].normal), cache: new Map() });
  }
  const { fonte, cache } = coberturas.get(familia);
  if (!cache.has(codigo)) cache.set(codigo, fonte.hasGlyphForCodePoint(codigo));
  return cache.get(codigo);
}

// Cadeia de famílias tentadas para um texto na família base: as fatias dela,
// as da Source Serif (mais alfabetos) e por fim a DejaVu.
const cadeias = new Map();
function cadeiaDe(base) {
  if (!cadeias.has(base)) {
    const propria = BASES[base] ? BASES[base].subconjuntos.map((s) => nomeFamilia(base, s)) : [base];
    const serif = base === "Serif" ? [] : BASES.Serif.subconjuntos.map((s) => nomeFamilia("Serif", s));
    cadeias.set(base, [...propria, ...serif, RESERVA]);
  }
  return cadeias.get(base);
}

// Área de uso privado usada pelas fontes Symbol/Wingdings do Word (texto
// colado do Word com marcadores e setas "desenhados").
const USO_PRIVADO = {
  0xf0b7: "•",
  0xf0a7: "▪",
  0xf0a8: "□",
  0xf0d8: "➢",
  0xf0fc: "✔",
  0xf0de: "⇒",
  0xf0ae: "→",
  0xf0ac: "←",
  0xf0e8: "➔",
};

// Formas tipográficas que têm equivalente nas fatias latin — ficam na mesma
// fonte do texto em vez de cair na reserva.
const EQUIVALENTES = {
  "‑": "-", // hífen inquebrável
  "‐": "-",
  " ": " ", // espaço estreito inquebrável
  " ": " ",
  " ": " ",
  " ": " ",
  "―": "—",
};

function normalizarTextoPdf(texto) {
  return String(texto)
    .normalize("NFC")
    .replace(/[­​-‍⁠﻿]/g, "")
    .replace(/\t/g, " ")
    .replace(/\r/g, "")
    .replace(/[‐‑    ―]/g, (c) => EQUIVALENTES[c])
    .replace(/[-]/g, (c) => USO_PRIVADO[c.codePointAt(0)] || "");
}

// Quebra o texto em trechos { texto, fonte } — a primeira família da cadeia
// que tem cada caractere. Quebras de linha e controles seguem o trecho atual.
function distribuir(texto, base) {
  const normalizado = normalizarTextoPdf(texto);
  const cadeia = cadeiaDe(base);
  const trechos = [];
  for (const caractere of normalizado) {
    const codigo = caractere.codePointAt(0);
    let fonte;
    if (codigo < 0x20) {
      fonte = trechos.length ? trechos[trechos.length - 1].fonte : cadeia[0];
    } else {
      fonte = cadeia.find((familia) => cobre(familia, codigo));
      if (!fonte) continue; // nenhuma fonte tem: some do texto
    }
    const ultimo = trechos[trechos.length - 1];
    if (ultimo && ultimo.fonte === fonte) ultimo.texto += caractere;
    else trechos.push({ texto: caractere, fonte });
  }
  return trechos;
}

// ---------------------------------------------------------------------------
// Aplicação na definição do documento
// ---------------------------------------------------------------------------

function familiaDoNo(no, herdada, estilos) {
  if (no.font) return no.font;
  const nomesEstilo = Array.isArray(no.style) ? no.style : no.style ? [no.style] : [];
  for (let i = nomesEstilo.length - 1; i >= 0; i -= 1) {
    const estilo = typeof nomesEstilo[i] === "string" ? estilos[nomesEstilo[i]] : nomesEstilo[i];
    if (estilo?.font) return estilo.font;
  }
  return herdada;
}

// Um pedaço de texto (string ou inline {text}) vira um ou mais inlines, cada
// um com a família certa. Propriedades de marcação (id, tocItem) ficam só no
// primeiro pedaço.
function inlinesDe(item, familia) {
  const base = typeof item === "string" ? { text: item } : item;
  const trechos = distribuir(base.text, familia);
  if (!trechos.length) return [{ ...base, text: "" }];
  return trechos.map((trecho, indice) => {
    const inline = { ...base, text: trecho.texto };
    if (trecho.fonte !== familia) inline.font = trecho.fonte;
    if (indice > 0) {
      delete inline.id;
      delete inline.tocItem;
    }
    return inline;
  });
}

function converterTexto(no, familia, estilos) {
  if (typeof no.text === "string" || typeof no.text === "number") {
    const trechos = distribuir(String(no.text), familia);
    if (trechos.length <= 1) {
      no.text = trechos[0]?.texto ?? "";
      if (trechos[0] && trechos[0].fonte !== familia) no.font = trechos[0].fonte;
      return;
    }
    no.text = trechos.map((trecho) => (trecho.fonte === familia ? trecho.texto : { text: trecho.texto, font: trecho.fonte }));
    return;
  }
  if (Array.isArray(no.text)) {
    no.text = no.text.flatMap((item) => {
      if (typeof item === "string" || typeof item === "number") return inlinesDe(String(item), familia);
      if (item && typeof item === "object") {
        const familiaItem = familiaDoNo(item, familia, estilos);
        if (typeof item.text === "string" || typeof item.text === "number") {
          return inlinesDe({ ...item, text: String(item.text) }, familiaItem);
        }
        aplicarNo(item, familiaItem, estilos);
        return [item];
      }
      return [item];
    });
    return;
  }
  if (no.text && typeof no.text === "object") aplicarNo(no.text, familia, estilos);
}

function envolverFuncao(funcao, familia, estilos) {
  if (typeof funcao !== "function") return funcao;
  return (...argumentos) => {
    const resultado = funcao(...argumentos);
    if (resultado && typeof resultado === "object") aplicarNo(resultado, familia, estilos);
    return resultado;
  };
}

function aplicarNo(no, herdada, estilos) {
  if (Array.isArray(no)) {
    no.forEach((filho, indice) => {
      if (typeof filho === "string") no[indice] = { text: filho };
      if (no[indice] && typeof no[indice] === "object") aplicarNo(no[indice], herdada, estilos);
    });
    return;
  }
  if (!no || typeof no !== "object") return;
  const familia = familiaDoNo(no, herdada, estilos);

  if ("text" in no) converterTexto(no, familia, estilos);
  for (const chave of ["stack", "ul", "ol", "columns", "section"]) {
    if (no[chave]) aplicarNo(no[chave], familia, estilos);
  }
  if (no.table?.body) no.table.body.forEach((linha) => aplicarNo(linha, familia, estilos));
  if (no.toc?.title) aplicarNo(no.toc.title, familia, estilos);
  if (no.section) {
    no.header = envolverFuncao(no.header, familia, estilos);
    no.footer = envolverFuncao(no.footer, familia, estilos);
  }
}

// Ajusta a definição do pdfmake no lugar: todo texto passa a usar só
// famílias que têm os seus caracteres.
function aplicarFontes(definicao) {
  const estilos = definicao.styles || {};
  const familia = definicao.defaultStyle?.font || "Serif";
  aplicarNo(definicao.content, familia, estilos);
  definicao.header = envolverFuncao(definicao.header, familia, estilos);
  definicao.footer = envolverFuncao(definicao.footer, familia, estilos);
  return definicao;
}

module.exports = { FONTES, PASTAS_FONTES, aplicarFontes, normalizarTextoPdf };
