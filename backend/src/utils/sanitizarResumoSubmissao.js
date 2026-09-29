const ErroHttp = require("./erroHttp");
const { CONFIG_RESUMO, criarPurificador, extrairTexto, contar } = require("./sanitizadorRichText");

// Instância própria (hooks ficam presos a ela — ver sanitizadorRichText.js).
const { DOMPurify, janela } = criarPurificador();

// Trava de payload bruto antes mesmo de sanitizar (proteção contra abuso —
// não é o limite "de verdade", que é só sobre o texto, ver TAMANHO_MAX_TEXTO).
const TAMANHO_MAX_ENTRADA = 3_000_000;
// Limite é só do TEXTO visível, sem contar tags/atributos de outros
// elementos — uma imagem embutida como data URI facilmente passa de 100 mil
// caracteres sozinha, e isso não é "texto que a pessoa escreveu".
const TAMANHO_MAX_TEXTO = 50_000;
const MAX_IMAGENS = 15;
const MAX_CELULAS = 500;

// Resumo em rich text da submissão (CampoRichText com permitirImagem e
// permitirTabela): negrito, itálico, lista, link, imagem e tabela. Imagens em
// data URI são trocadas por URL do GCS depois daqui (processarImagensEmbutidas.js).
function sanitizarResumoSubmissao(html) {
  if (typeof html !== "string") return "";
  if (html.length > TAMANHO_MAX_ENTRADA) {
    throw new ErroHttp(400, "Resumo muito grande — reduza o tamanho do texto ou das imagens.");
  }

  const sanitizado = DOMPurify.sanitize(html, CONFIG_RESUMO).trim();

  if (extrairTexto(janela, sanitizado).length > TAMANHO_MAX_TEXTO) {
    throw new ErroHttp(
      400,
      `O resumo pode ter no máximo ${TAMANHO_MAX_TEXTO.toLocaleString("pt-BR")} caracteres de texto.`
    );
  }
  if (contar(janela, sanitizado, "img") > MAX_IMAGENS) {
    throw new ErroHttp(400, `O resumo pode ter no máximo ${MAX_IMAGENS} imagens.`);
  }
  if (contar(janela, sanitizado, "td, th") > MAX_CELULAS) {
    throw new ErroHttp(400, `As tabelas do resumo podem ter no máximo ${MAX_CELULAS} células no total.`);
  }

  return sanitizado;
}

module.exports = sanitizarResumoSubmissao;
