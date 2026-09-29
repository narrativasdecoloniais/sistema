const ErroHttp = require("./erroHttp");
const { CONFIG_EDITAL, criarPurificador, extrairTexto, contar } = require("./sanitizadorRichText");

// Instância própria (hooks ficam presos a ela — ver sanitizadorRichText.js).
const { DOMPurify, janela } = criarPurificador();

// Trava do payload bruto antes de sanitizar; o limite "de verdade" é o do
// texto visível (tabelas geram muito HTML em volta de pouco texto).
const TAMANHO_MAX_ENTRADA = 300_000;
const TAMANHO_MAX_TEXTO = 50_000;
const MAX_CELULAS = 500;

// Edital da monitoria (CampoRichText com títulos, listas e tabela) — exibido
// na página pública /monitoria via ConteudoRichText tipo="edital".
function sanitizarEditalMonitoria(html) {
  if (typeof html !== "string") return "";
  if (html.length > TAMANHO_MAX_ENTRADA) throw new ErroHttp(400, "O edital está grande demais.");

  const sanitizado = DOMPurify.sanitize(html, CONFIG_EDITAL).trim();

  if (extrairTexto(janela, sanitizado).length > TAMANHO_MAX_TEXTO) {
    throw new ErroHttp(400, `O edital pode ter no máximo ${TAMANHO_MAX_TEXTO.toLocaleString("pt-BR")} caracteres de texto.`);
  }
  if (contar(janela, sanitizado, "td, th") > MAX_CELULAS) {
    throw new ErroHttp(400, `As tabelas do edital podem ter no máximo ${MAX_CELULAS} células no total.`);
  }
  // Sem texto visível (ex. "<p></p>") vale como vazio.
  return extrairTexto(janela, sanitizado).trim() || sanitizado.includes("<table") ? sanitizado : "";
}

module.exports = sanitizarEditalMonitoria;
