const { JSDOM } = require("jsdom");
const createDOMPurify = require("dompurify");
const env = require("../config/env");

// Núcleo da sanitização do rich text das submissões (resumo e referência).
// As allowlists daqui são espelhadas em frontend/lib/richText.js, que
// sanitiza de novo na hora de exibir — mudou aqui, muda lá.

const TAGS_TEXTO = ["p", "br", "strong", "em", "a"];

const CONFIG_RESUMO = {
  ALLOWED_TAGS: [...TAGS_TEXTO, "ul", "ol", "li", "img", "table", "thead", "tbody", "tr", "th", "td", "colgroup", "col"],
  ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "colspan", "rowspan", "colwidth"],
};

const CONFIG_REFERENCIA = {
  ALLOWED_TAGS: TAGS_TEXTO,
  ALLOWED_ATTR: ["href", "target", "rel"],
};

// Edital da monitoria (texto da organização): título/subtítulo (h2/h3),
// listas e tabela, sem imagem.
const CONFIG_EDITAL = {
  ALLOWED_TAGS: [...TAGS_TEXTO, "h2", "h3", "ul", "ol", "li", "table", "thead", "tbody", "tr", "th", "td", "colgroup", "col"],
  ALLOWED_ATTR: ["href", "target", "rel", "colspan", "rowspan", "colwidth"],
};

// Imagem só pode ser data URI de imagem raster (vira URL do GCS logo depois,
// ver processarImagensEmbutidas.js) ou já estar no nosso bucket público —
// nunca um domínio externo (rastreamento, conteúdo misto, hotlink).
const PREFIXO_BUCKET = `https://storage.googleapis.com/${env.gcsBucketPublico}/`;
const DATA_URI_IMAGEM = /^data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i;
const HREF_PERMITIDO = /^(https?:|mailto:)/i;
const NUMERO_CELULA = /^[1-9]\d?$/; // 1–99, limitado a 50 abaixo
const LISTA_LARGURAS = /^\d{1,4}(,\d{1,4})*$/;

function srcPermitido(valor) {
  return DATA_URI_IMAGEM.test(valor) || valor.startsWith(PREFIXO_BUCKET);
}

function criarPurificador() {
  const janela = new JSDOM("").window;
  const DOMPurify = createDOMPurify(janela);

  DOMPurify.addHook("uponSanitizeAttribute", (_no, dados) => {
    const valor = String(dados.attrValue || "").trim();
    switch (dados.attrName) {
      case "href":
        dados.keepAttr = HREF_PERMITIDO.test(valor);
        break;
      case "src":
        dados.keepAttr = srcPermitido(valor);
        // DOMPurify revalida URIs por conta própria e só aceita data: em
        // <img>; o forceKeepAttr evita que ele descarte o data URI que já
        // conferimos acima com uma regra mais estrita que a dele.
        if (dados.keepAttr) dados.forceKeepAttr = true;
        break;
      case "colspan":
      case "rowspan":
        dados.keepAttr = NUMERO_CELULA.test(valor) && Number(valor) <= 50;
        break;
      case "colwidth":
        dados.keepAttr = LISTA_LARGURAS.test(valor);
        break;
      default:
        break;
    }
  });

  DOMPurify.addHook("afterSanitizeAttributes", (no) => {
    if (no.tagName === "A") {
      if (!no.getAttribute("href")) {
        no.removeAttribute("target");
        no.removeAttribute("rel");
        return;
      }
      no.setAttribute("target", "_blank");
      no.setAttribute("rel", "noopener noreferrer");
    }
    // <img> sem src válido não serve pra nada — some de vez.
    if (no.tagName === "IMG" && !no.getAttribute("src")) no.remove();
  });

  return { DOMPurify, janela };
}

function extrairTexto(janela, html) {
  const elemento = janela.document.createElement("div");
  elemento.innerHTML = html;
  return elemento.textContent || "";
}

function contar(janela, html, seletor) {
  const elemento = janela.document.createElement("div");
  elemento.innerHTML = html;
  return elemento.querySelectorAll(seletor).length;
}

module.exports = {
  CONFIG_RESUMO,
  CONFIG_REFERENCIA,
  CONFIG_EDITAL,
  PREFIXO_BUCKET,
  DATA_URI_IMAGEM,
  criarPurificador,
  extrairTexto,
  contar,
};
