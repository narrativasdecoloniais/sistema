const { JSDOM } = require("jsdom");
const storageService = require("../services/storage.service");
const ErroHttp = require("./erroHttp");

const LIMITE_IMAGENS = 8;

// Depois que o HTML do resumo já foi sanitizado (sanitizarResumoSubmissao.js),
// troca cada <img src="data:image/..."> por uma URL do GCS — mesmo padrão já
// usado em edicoes.service.js/gruposConteudo.service.js para campos de
// imagem avulsos, só que aqui a imagem está embutida dentro de um bloco de
// rich text em vez de ser o valor inteiro do campo.
async function processarImagensEmbutidas(html, pasta) {
  if (!html) return html;

  const dom = new JSDOM(html);
  const imagens = Array.from(dom.window.document.querySelectorAll("img[src^='data:image/']"));

  if (imagens.length > LIMITE_IMAGENS) {
    throw new ErroHttp(400, `No máximo ${LIMITE_IMAGENS} imagens por resumo.`);
  }

  for (const imagem of imagens) {
    const url = await storageService.salvarImagemPublica(imagem.getAttribute("src"), pasta);
    imagem.setAttribute("src", url);
  }

  return dom.window.document.body.innerHTML;
}

module.exports = processarImagensEmbutidas;
