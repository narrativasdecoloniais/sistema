const ErroHttp = require("./erroHttp");
const { CONFIG_EDITAL, criarPurificador, extrairTexto, contar } = require("./sanitizadorRichText");

// Instância própria (hooks ficam presos a ela — ver sanitizadorRichText.js).
const { DOMPurify, janela } = criarPurificador();

const TAMANHO_MAX_ENTRADA = 300_000;
const TAMANHO_MAX_TEXTO = 30_000;
const MAX_CELULAS = 300;

// Apresentação dos Anais (texto da organização, mesma allowlist do edital da
// monitoria: títulos, listas e tabela, sem imagem) — exibida na página
// pública dos Anais via ConteudoRichText tipo="edital" e no PDF/Word.
function sanitizarApresentacaoAnais(html) {
  if (typeof html !== "string") return "";
  if (html.length > TAMANHO_MAX_ENTRADA) throw new ErroHttp(400, "A apresentação está grande demais.");

  const sanitizado = DOMPurify.sanitize(html, CONFIG_EDITAL).trim();
  const texto = extrairTexto(janela, sanitizado).trim();

  if (texto.length > TAMANHO_MAX_TEXTO) {
    throw new ErroHttp(
      400,
      `A apresentação pode ter no máximo ${TAMANHO_MAX_TEXTO.toLocaleString("pt-BR")} caracteres de texto.`
    );
  }
  if (contar(janela, sanitizado, "td, th") > MAX_CELULAS) {
    throw new ErroHttp(400, `As tabelas da apresentação podem ter no máximo ${MAX_CELULAS} células no total.`);
  }
  return texto || sanitizado.includes("<table") ? sanitizado : "";
}

module.exports = sanitizarApresentacaoAnais;
