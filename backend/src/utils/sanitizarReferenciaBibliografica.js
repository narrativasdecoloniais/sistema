const ErroHttp = require("./erroHttp");
const { CONFIG_REFERENCIA, criarPurificador } = require("./sanitizadorRichText");

const { DOMPurify } = criarPurificador();

const TAMANHO_MAX_ENTRADA = 20_000;

// Referência bibliográfica (CampoRichText com ferramentas negrito, itálico e
// link) — sem lista, imagem ou tabela.
function sanitizarReferenciaBibliografica(html) {
  if (typeof html !== "string") return "";
  if (html.length > TAMANHO_MAX_ENTRADA) {
    throw new ErroHttp(400, "Referência bibliográfica muito grande.");
  }
  return DOMPurify.sanitize(html, CONFIG_REFERENCIA).trim();
}

module.exports = sanitizarReferenciaBibliografica;
