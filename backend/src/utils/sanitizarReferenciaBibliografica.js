const { JSDOM } = require("jsdom");
const createDOMPurify = require("dompurify");
const ErroHttp = require("./erroHttp");

const DOMPurify = createDOMPurify(new JSDOM("").window);

const TAMANHO_MAX_ENTRADA = 20_000;

// Referência bibliográfica da submissão (ver CampoRichText.jsx, variante
// ferramentas={["negrito"]}) — só permite negrito, sem link/itálico/lista/
// imagem, por pedido explícito do formulário.
const CONFIG_SANITIZACAO = {
  ALLOWED_TAGS: ["p", "br", "strong"],
  ALLOWED_ATTR: [],
};

function sanitizarReferenciaBibliografica(html) {
  if (typeof html !== "string") return "";
  if (html.length > TAMANHO_MAX_ENTRADA) {
    throw new ErroHttp(400, "Referência bibliográfica muito grande.");
  }
  return DOMPurify.sanitize(html, CONFIG_SANITIZACAO).trim();
}

module.exports = sanitizarReferenciaBibliografica;
