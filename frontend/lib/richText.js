import DOMPurify from "dompurify";

// Espelho das allowlists de backend/src/utils/sanitizadorRichText.js — o
// backend sanitiza ao salvar (autoridade); aqui sanitiza de novo ao exibir,
// como defesa em profundidade caso algo antigo ou fora do fluxo tenha
// chegado ao banco. Mudou lá, muda aqui.

const TAGS_TEXTO = ["p", "br", "strong", "em", "a"];

export const CONFIG_RESUMO = {
  ALLOWED_TAGS: [...TAGS_TEXTO, "ul", "ol", "li", "img", "table", "thead", "tbody", "tr", "th", "td", "colgroup", "col"],
  ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "colspan", "rowspan", "colwidth"],
};

export const CONFIG_REFERENCIA = {
  ALLOWED_TAGS: TAGS_TEXTO,
  ALLOWED_ATTR: ["href", "target", "rel"],
};

// Textos da organização (ex. corpo de e-mail de resultado): como o resumo,
// sem imagem nem tabela.
export const CONFIG_TEXTO = {
  ALLOWED_TAGS: [...TAGS_TEXTO, "ul", "ol", "li"],
  ALLOWED_ATTR: ["href", "target", "rel"],
};

// Edital da monitoria: título/subtítulo (h2/h3), listas e tabela, sem imagem.
export const CONFIG_EDITAL = {
  ALLOWED_TAGS: [...TAGS_TEXTO, "h2", "h3", "ul", "ol", "li", "table", "thead", "tbody", "tr", "th", "td", "colgroup", "col"],
  ALLOWED_ATTR: ["href", "target", "rel", "colspan", "rowspan", "colwidth"],
};

// Descrição da atividade: como o resumo, com imagem, sem tabela.
export const CONFIG_DESCRICAO_ATIVIDADE = {
  ALLOWED_TAGS: [...TAGS_TEXTO, "ul", "ol", "li", "img"],
  ALLOWED_ATTR: ["href", "target", "rel", "src", "alt"],
};

// Texto de certificado: parágrafo, quebra de linha, negrito e itálico (o que o
// gerador de PDF desenha).
export const CONFIG_CERTIFICADO = {
  ALLOWED_TAGS: ["p", "br", "strong", "em"],
  ALLOWED_ATTR: [],
};

// O front não conhece o nome do bucket — aceita qualquer objeto do GCS
// público; o backend (que conhece) restringe ao nosso bucket ao salvar.
const PREFIXO_GCS = "https://storage.googleapis.com/";
const DATA_URI_IMAGEM = /^data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i;
const HREF_PERMITIDO = /^(https?:|mailto:)/i;
const NUMERO_CELULA = /^[1-9]\d?$/;
const LISTA_LARGURAS = /^\d{1,4}(,\d{1,4})*$/;

// Instância própria (hooks presos a ela), criada no primeiro uso no navegador.
let purificador = null;

function obterPurificador() {
  if (purificador) return purificador;
  purificador = DOMPurify(window);

  purificador.addHook("uponSanitizeAttribute", (_no, dados) => {
    const valor = String(dados.attrValue || "").trim();
    if (dados.attrName === "href") dados.keepAttr = HREF_PERMITIDO.test(valor);
    if (dados.attrName === "src") {
      dados.keepAttr = DATA_URI_IMAGEM.test(valor) || valor.startsWith(PREFIXO_GCS);
      if (dados.keepAttr) dados.forceKeepAttr = true;
    }
    if (dados.attrName === "colspan" || dados.attrName === "rowspan") {
      dados.keepAttr = NUMERO_CELULA.test(valor) && Number(valor) <= 50;
    }
    if (dados.attrName === "colwidth") dados.keepAttr = LISTA_LARGURAS.test(valor);
  });

  purificador.addHook("afterSanitizeAttributes", (no) => {
    if (no.tagName === "A") {
      if (!no.getAttribute("href")) {
        no.removeAttribute("target");
        no.removeAttribute("rel");
        return;
      }
      no.setAttribute("target", "_blank");
      no.setAttribute("rel", "noopener noreferrer");
    }
    if (no.tagName === "IMG" && !no.getAttribute("src")) no.remove();
  });

  return purificador;
}

// Só no navegador (DOMPurify precisa de window) — ver ConteudoRichText.jsx.
export function sanitizarRichText(html, config) {
  if (!html || typeof window === "undefined") return "";
  return obterPurificador().sanitize(html, config);
}

// O editor sempre gera HTML começando por um bloco (<p>, lista, imagem);
// texto puro antigo nunca começa assim, mesmo que tenha um "<" no meio.
const EH_HTML = /^\s*<(p|ul|ol|img)\b/i;
const MAPA_ESCAPE = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

// Descrições de atividade anteriores ao rich text são texto puro, com
// parágrafos separados por linha em branco — viram HTML escapado pra abrir no
// editor e exibir. HTML passa direto. Espelho de textoPuroParaHtml em
// backend/src/utils/sanitizarDescricaoAtividade.js.
export function descricaoAtividadeHtml(texto) {
  if (!texto || !texto.trim()) return "";
  if (EH_HTML.test(texto)) return texto;
  return texto
    .split(/\n\s*\n/)
    .map((paragrafo) => paragrafo.trim())
    .filter(Boolean)
    .map((paragrafo) => `<p>${paragrafo.replace(/[&<>"']/g, (c) => MAPA_ESCAPE[c]).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// Texto corrido do rich text, um item por parágrafo/item de lista, sem
// imagens — pra saídas que não renderizam HTML (PDF da programação). Só no
// navegador (DOMParser).
export function paragrafosDoRichText(html) {
  if (!html || typeof window === "undefined") return [];
  const documento = new DOMParser().parseFromString(descricaoAtividadeHtml(html), "text/html");
  return Array.from(documento.body.querySelectorAll("p, li"))
    .filter((bloco) => bloco.tagName === "LI" || !bloco.closest("li"))
    .map((bloco) => {
      if (bloco.tagName !== "LI") return bloco.textContent.trim();
      // O TipTap põe o texto do item num <p>; lista aninhada sai como itens
      // próprios, então só o texto direto do item conta aqui.
      const paragrafos = Array.from(bloco.children).filter((filho) => filho.tagName === "P");
      const texto = (paragrafos.length ? paragrafos.map((p) => p.textContent).join(" ") : bloco.textContent).trim();
      if (!texto) return "";
      const lista = bloco.parentElement;
      const marcador = lista?.tagName === "OL" ? `${Array.from(lista.children).indexOf(bloco) + 1}. ` : "• ";
      return `${marcador}${texto}`;
    })
    .filter(Boolean);
}
