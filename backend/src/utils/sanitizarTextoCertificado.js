const ErroHttp = require("./erroHttp");
const { CONFIG_CERTIFICADO, criarPurificador, extrairTexto } = require("./sanitizadorRichText");

// Instância própria (hooks ficam presos a ela — ver sanitizadorRichText.js).
const { DOMPurify, janela } = criarPurificador();

const TAMANHO_MAX_ENTRADA = 50_000;
const TAMANHO_MAX_TEXTO = 5_000;

// Texto de um modelo de certificado (CampoRichText com negrito/itálico). Os
// {{marcadores}} passam intactos — são trocados só na hora de desenhar o PDF.
function sanitizarTextoCertificado(html) {
  if (typeof html !== "string") return "";
  if (html.length > TAMANHO_MAX_ENTRADA) throw new ErroHttp(400, "O texto do certificado está grande demais.");

  const sanitizado = DOMPurify.sanitize(html, CONFIG_CERTIFICADO).trim();
  const texto = extrairTexto(janela, sanitizado).trim();

  if (texto.length > TAMANHO_MAX_TEXTO) {
    throw new ErroHttp(400, `O texto do certificado pode ter no máximo ${TAMANHO_MAX_TEXTO.toLocaleString("pt-BR")} caracteres.`);
  }
  return texto ? sanitizado : "";
}

module.exports = sanitizarTextoCertificado;
