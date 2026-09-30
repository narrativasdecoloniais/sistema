const { JSDOM } = require("jsdom");

// Converte o HTML já sanitizado do rich text (resumo, referência,
// apresentação dos Anais — allowlists de sanitizadorRichText.js) numa lista
// de blocos neutros, que o PDF (pdfAnais.service.js) e o Word
// (docxAnais.service.js) sabem desenhar. Tag fora da allowlist nem chega
// aqui; se chegar, o conteúdo de texto dela é mantido sem formatação.
//
// Blocos:
//   { tipo: "paragrafo", trechos }
//   { tipo: "titulo", nivel: 2|3, trechos }
//   { tipo: "lista", ordenada, itens: [[bloco]] }
//   { tipo: "imagem", src, alt }            (dados/dimensões preenchidos depois)
//   { tipo: "tabela", linhas: [[{ cabecalho, colspan, rowspan, blocos }]] }
// Trecho: { texto, negrito, italico, link }  — "\n" em texto = quebra de linha.

const { window } = new JSDOM("");

const BLOCOS = new Set(["P", "H2", "H3", "UL", "OL", "TABLE", "IMG", "DIV", "BLOCKQUOTE"]);

function juntarEspacos(trechos) {
  const resultado = [];
  for (const trecho of trechos) {
    const anterior = resultado[resultado.length - 1];
    if (
      anterior &&
      anterior.negrito === trecho.negrito &&
      anterior.italico === trecho.italico &&
      anterior.link === trecho.link
    ) {
      anterior.texto += trecho.texto;
    } else {
      resultado.push({ ...trecho });
    }
  }
  // Espaços em branco do HTML colapsam como no navegador.
  for (const trecho of resultado) trecho.texto = trecho.texto.replace(/[ \t\r\f\v ]*\n[ \t\r\f\v ]*/g, "\n");
  if (resultado.length) {
    resultado[0].texto = resultado[0].texto.replace(/^[ \t]+/, "");
    const ultimo = resultado[resultado.length - 1];
    ultimo.texto = ultimo.texto.replace(/[ \t]+$/, "");
  }
  return resultado.filter((trecho) => trecho.texto !== "");
}

function trechosInline(no, estilo = {}) {
  const trechos = [];
  for (const filho of no.childNodes) {
    if (filho.nodeType === window.Node.TEXT_NODE) {
      const texto = filho.textContent.replace(/[ \t\r\n\f\v]+/g, " ");
      if (texto) trechos.push({ texto, negrito: !!estilo.negrito, italico: !!estilo.italico, link: estilo.link || null });
      continue;
    }
    if (filho.nodeType !== window.Node.ELEMENT_NODE) continue;
    const tag = filho.tagName;
    if (tag === "BR") {
      trechos.push({ texto: "\n", negrito: !!estilo.negrito, italico: !!estilo.italico, link: estilo.link || null });
    } else if (tag === "STRONG" || tag === "B") {
      trechos.push(...trechosInline(filho, { ...estilo, negrito: true }));
    } else if (tag === "EM" || tag === "I") {
      trechos.push(...trechosInline(filho, { ...estilo, italico: true }));
    } else if (tag === "A") {
      const href = filho.getAttribute("href");
      trechos.push(...trechosInline(filho, { ...estilo, link: href && /^(https?:|mailto:)/i.test(href) ? href : estilo.link }));
    } else if (!BLOCOS.has(tag)) {
      trechos.push(...trechosInline(filho, estilo));
    }
  }
  return trechos;
}

function paragrafo(trechos, tipo = "paragrafo", extra = {}) {
  const limpos = juntarEspacos(trechos);
  // Parágrafo só com quebras/espaços não desenha nada.
  if (!limpos.some((trecho) => trecho.texto.trim())) return null;
  return { tipo, trechos: limpos, ...extra };
}

function numero(valor, padrao = 1) {
  const n = Number.parseInt(valor, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 50) : padrao;
}

function tabela(no) {
  const linhas = [];
  for (const tr of no.querySelectorAll("tr")) {
    // Ignora tabelas aninhadas (o editor não produz, mas por segurança).
    if (tr.closest("table") !== no) continue;
    const celulas = [];
    for (const celula of tr.children) {
      if (celula.tagName !== "TD" && celula.tagName !== "TH") continue;
      const blocos = blocosDeFilhos(celula);
      celulas.push({
        cabecalho: celula.tagName === "TH",
        colspan: numero(celula.getAttribute("colspan")),
        rowspan: numero(celula.getAttribute("rowspan")),
        blocos: blocos.length ? blocos : [{ tipo: "paragrafo", trechos: [] }],
      });
    }
    if (celulas.length) linhas.push(celulas);
  }
  return linhas.length ? { tipo: "tabela", linhas } : null;
}

function lista(no) {
  const itens = [];
  for (const li of no.children) {
    if (li.tagName !== "LI") continue;
    const blocos = blocosDeFilhos(li);
    if (blocos.length) itens.push(blocos);
  }
  return itens.length ? { tipo: "lista", ordenada: no.tagName === "OL", itens } : null;
}

// Percorre os filhos agrupando texto/inline solto num parágrafo implícito.
function blocosDeFilhos(no) {
  const blocos = [];
  let pendente = [];

  const fecharPendente = () => {
    const bloco = paragrafo(pendente);
    if (bloco) blocos.push(bloco);
    pendente = [];
  };

  for (const filho of no.childNodes) {
    const tag = filho.nodeType === window.Node.ELEMENT_NODE ? filho.tagName : null;
    if (!tag || !BLOCOS.has(tag)) {
      if (tag) {
        const wrapper = window.document.createElement("span");
        wrapper.appendChild(filho.cloneNode(true));
        pendente.push(...trechosInline(wrapper));
      } else if (filho.nodeType === window.Node.TEXT_NODE) {
        pendente.push(...trechosInline({ childNodes: [filho] }));
      }
      continue;
    }

    fecharPendente();
    let bloco = null;
    if (tag === "P") bloco = paragrafo(trechosInline(filho));
    else if (tag === "H2" || tag === "H3") bloco = paragrafo(trechosInline(filho), "titulo", { nivel: tag === "H2" ? 2 : 3 });
    else if (tag === "UL" || tag === "OL") bloco = lista(filho);
    else if (tag === "TABLE") bloco = tabela(filho);
    else if (tag === "IMG") {
      const src = filho.getAttribute("src");
      if (src) bloco = { tipo: "imagem", src, alt: filho.getAttribute("alt") || "" };
    } else {
      blocos.push(...blocosDeFilhos(filho));
    }
    if (bloco) blocos.push(bloco);
  }
  fecharPendente();
  return blocos;
}

function extrairImagensDeParagrafos(no) {
  // O TipTap salva imagem como <img> direto no corpo, mas conteúdo importado
  // pode trazer <p><img></p>: sobe a imagem para o nível do parágrafo.
  for (const img of [...no.querySelectorAll("p > img, h2 > img, h3 > img, li > img")]) {
    const pai = img.parentElement;
    if (pai.tagName === "LI") continue;
    pai.parentElement.insertBefore(img, pai.nextSibling);
  }
}

function htmlParaBlocos(html) {
  if (!html || typeof html !== "string") return [];
  const container = window.document.createElement("div");
  container.innerHTML = html;
  extrairImagensDeParagrafos(container);
  return blocosDeFilhos(container);
}

// Percorre todos os blocos (inclusive dentro de listas e tabelas).
function* percorrerBlocos(blocos) {
  for (const bloco of blocos) {
    yield bloco;
    if (bloco.tipo === "lista") for (const item of bloco.itens) yield* percorrerBlocos(item);
    if (bloco.tipo === "tabela") {
      for (const linha of bloco.linhas) for (const celula of linha) yield* percorrerBlocos(celula.blocos);
    }
  }
}

module.exports = { htmlParaBlocos, percorrerBlocos };
