const { JSDOM } = require("jsdom");
const createDOMPurify = require("dompurify");

// Instância própria (não compartilhada com sanitizarSvgLogo.js) — cada
// sanitizador tem sua própria janela headless e config, sem risco de um
// afetar o outro.
const DOMPurify = createDOMPurify(new JSDOM("").window);

const TAMANHO_MAX_ENTRADA = 20_000;

// Corpo em rich text da mensagem de contribuição (ver CampoRichText.jsx no
// admin e CardContribuicao.jsx no público) — HTML gerado pelo editor TipTap,
// sanitizado de novo aqui antes de salvar (nunca confiar só no editor).
// Toolbar do admin só oferece negrito/itálico/lista/link, então o allowlist
// é propositalmente restrito a isso — nada de script, estilo, mídia ou
// atributos de evento.
const CONFIG_SANITIZACAO = {
  ALLOWED_TAGS: ["p", "br", "strong", "em", "a", "ul", "ol", "li"],
  ALLOWED_ATTR: ["href", "target", "rel"],
};

function sanitizarCorpoContribuicao(html) {
  if (typeof html !== "string") return "";
  if (html.length > TAMANHO_MAX_ENTRADA) {
    throw new Error("Texto muito grande.");
  }
  return DOMPurify.sanitize(html, CONFIG_SANITIZACAO).trim();
}

module.exports = sanitizarCorpoContribuicao;
