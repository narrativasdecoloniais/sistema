const { JSDOM } = require("jsdom");
const createDOMPurify = require("dompurify");
const ErroHttp = require("./erroHttp");

// Instância própria (não compartilhada com os outros sanitizadores) — cada
// um tem sua própria janela headless e config. Guardamos a window pra
// reaproveitar (ver extrairTexto) em vez de criar outra instância JSDOM.
const janela = new JSDOM("").window;
const DOMPurify = createDOMPurify(janela);

// Trava de payload bruto antes mesmo de sanitizar (proteção contra abuso —
// não é o limite "de verdade", que é só sobre o texto, ver TAMANHO_MAX_TEXTO).
const TAMANHO_MAX_ENTRADA = 3_000_000;
// Limite é só do TEXTO visível, sem contar tags/atributos de outros
// elementos — uma imagem embutida como data URI facilmente passa de 100 mil
// caracteres sozinha, e isso não é "texto que a pessoa escreveu".
const TAMANHO_MAX_TEXTO = 50_000;

// Resumo em rich text da submissão de trabalho (ver CampoRichText.jsx,
// variante com permitirImagem). Toolbar do editor oferece negrito, itálico,
// lista, link e inserção de imagem — allowlist espelha isso. "img" fica na
// lista porque o DOMPurify preserva data URIs em src de <img> por padrão
// (um dos DATA_URI_TAGS nativos); a imagem em si é trocada por uma URL do
// GCS depois da sanitização, ver processarImagensEmbutidas.js — nunca fica
// base64 salvo no banco.
const CONFIG_SANITIZACAO = {
  ALLOWED_TAGS: ["p", "br", "strong", "em", "a", "ul", "ol", "li", "img"],
  ALLOWED_ATTR: ["href", "target", "rel", "src", "alt"],
};

function extrairTexto(html) {
  const elemento = janela.document.createElement("div");
  elemento.innerHTML = html;
  return elemento.textContent || "";
}

function sanitizarResumoSubmissao(html) {
  if (typeof html !== "string") return "";
  if (html.length > TAMANHO_MAX_ENTRADA) {
    throw new ErroHttp(400, "Resumo muito grande — reduza o tamanho do texto ou das imagens.");
  }

  const sanitizado = DOMPurify.sanitize(html, CONFIG_SANITIZACAO).trim();

  if (extrairTexto(sanitizado).length > TAMANHO_MAX_TEXTO) {
    throw new ErroHttp(
      400,
      `O resumo pode ter no máximo ${TAMANHO_MAX_TEXTO.toLocaleString("pt-BR")} caracteres de texto.`
    );
  }

  return sanitizado;
}

module.exports = sanitizarResumoSubmissao;
