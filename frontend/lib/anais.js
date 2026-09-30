// Utilidades dos Anais usadas no servidor e no navegador. As consultas à API
// (com cache por requisição) ficam em lib/anaisServidor.js.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// URL pública do site (canonical, Open Graph, sitemap, "Disponível em").
export const URL_SITE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

// Espelho de backend/src/utils/licencasAnais.js — mudou lá, muda aqui.
export const LICENCAS_ANAIS = {
  CC_BY: { sigla: "CC BY 4.0", nome: "Creative Commons Atribuição 4.0 Internacional", url: "https://creativecommons.org/licenses/by/4.0/deed.pt-br" },
  CC_BY_SA: { sigla: "CC BY-SA 4.0", nome: "Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional", url: "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br" },
  CC_BY_NC: { sigla: "CC BY-NC 4.0", nome: "Creative Commons Atribuição-NãoComercial 4.0 Internacional", url: "https://creativecommons.org/licenses/by-nc/4.0/deed.pt-br" },
  CC_BY_NC_SA: { sigla: "CC BY-NC-SA 4.0", nome: "Creative Commons Atribuição-NãoComercial-CompartilhaIgual 4.0 Internacional", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.pt-br" },
  CC_BY_ND: { sigla: "CC BY-ND 4.0", nome: "Creative Commons Atribuição-SemDerivações 4.0 Internacional", url: "https://creativecommons.org/licenses/by-nd/4.0/deed.pt-br" },
  CC_BY_NC_ND: { sigla: "CC BY-NC-ND 4.0", nome: "Creative Commons Atribuição-NãoComercial-SemDerivações 4.0 Internacional", url: "https://creativecommons.org/licenses/by-nc-nd/4.0/deed.pt-br" },
  TODOS_DIREITOS_RESERVADOS: { sigla: "Todos os direitos reservados", nome: "Todos os direitos reservados", url: null },
};

export function urlPdfArtigo(edicaoSlug, artigoSlug) {
  return `${API_URL}/publico/anais/${encodeURIComponent(edicaoSlug)}/artigos/${encodeURIComponent(artigoSlug)}/pdf`;
}

export function rotuloPaginas(inicial, final) {
  if (!inicial) return null;
  return final && final !== inicial ? `p. ${inicial}–${final}` : `p. ${inicial}`;
}

export function linhaIdentificadores(anais) {
  return [anais?.issn && `ISSN ${anais.issn}`, anais?.isbn && `ISBN ${anais.isbn}`].filter(Boolean).join(" · ");
}

// Busca sem acento e sem caixa.
export function normalizarBusca(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function recortarTexto(texto, limite) {
  const limpo = String(texto || "").trim();
  if (limpo.length <= limite) return limpo;
  const cortado = limpo.slice(0, limite);
  const espaco = cortado.lastIndexOf(" ");
  return `${(espaco > limite * 0.6 ? cortado.slice(0, espaco) : cortado).replace(/[\s,.;:]+$/, "")}…`;
}

export function formatarDataPublicacao(iso) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(
    new Date(iso)
  );
}
