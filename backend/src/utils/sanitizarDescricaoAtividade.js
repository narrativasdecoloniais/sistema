const ErroHttp = require("./erroHttp");
const escaparHtml = require("./escaparHtml");
const { CONFIG_DESCRICAO_ATIVIDADE, criarPurificador, extrairTexto, contar } = require("./sanitizadorRichText");

// Instância própria (hooks ficam presos a ela — ver sanitizadorRichText.js).
const { DOMPurify, janela } = criarPurificador();

// Trava do payload bruto (imagens novas chegam como data URI); o limite "de
// verdade" é só do texto visível — ver sanitizarResumoSubmissao.js.
const TAMANHO_MAX_ENTRADA = 3_000_000;
const TAMANHO_MAX_TEXTO = 20_000;
// Mesmo teto de processarImagensEmbutidas.js, que roda logo depois.
const MAX_IMAGENS = 15;

// O editor sempre gera HTML começando por um bloco (<p>, lista, imagem);
// texto puro antigo nunca começa assim, mesmo que tenha um "<" no meio.
const EH_HTML = /^\s*<(p|ul|ol|img)\b/i;

// Descrições anteriores ao rich text são texto puro, com parágrafos
// separados por linha em branco. Viram HTML aqui (escapado), então ler e
// salvar de novo dá sempre HTML. Espelho em frontend/lib/richText.js.
function textoPuroParaHtml(texto) {
  return texto
    .split(/\n\s*\n/)
    .map((paragrafo) => paragrafo.trim())
    .filter(Boolean)
    .map((paragrafo) => `<p>${escaparHtml(paragrafo).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// Descrição da atividade em rich text (CampoRichText com permitirImagem no
// AtividadeForm): negrito, itálico, lista, link e imagem. Usada ao salvar
// (imagens em data URI viram URL do GCS logo depois, em
// atividades.service.js) e de novo na leitura pública (paraPublico), que
// renderiza no servidor. Vazio vira null.
function sanitizarDescricaoAtividade(valor) {
  if (typeof valor !== "string" || !valor.trim()) return null;
  if (valor.length > TAMANHO_MAX_ENTRADA) {
    throw new ErroHttp(400, "Descrição muito grande — reduza o tamanho do texto ou das imagens.");
  }

  const html = EH_HTML.test(valor) ? valor : textoPuroParaHtml(valor);
  const sanitizado = DOMPurify.sanitize(html, CONFIG_DESCRICAO_ATIVIDADE).trim();

  if (extrairTexto(janela, sanitizado).length > TAMANHO_MAX_TEXTO) {
    throw new ErroHttp(
      400,
      `A descrição pode ter no máximo ${TAMANHO_MAX_TEXTO.toLocaleString("pt-BR")} caracteres de texto.`
    );
  }
  if (contar(janela, sanitizado, "img") > MAX_IMAGENS) {
    throw new ErroHttp(400, `A descrição pode ter no máximo ${MAX_IMAGENS} imagens.`);
  }

  return sanitizado || null;
}

module.exports = sanitizarDescricaoAtividade;
