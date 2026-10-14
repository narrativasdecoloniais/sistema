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

// Capa, modelo de página e faixas de cabeçalho/rodapé dos Anais (PDF/Word) —
// espelha os limites de backend/src/services/imagensAnais.service.js e a
// altura máxima da faixa em pdfAnais.service.js (150 pt numa página de 595 pt
// de largura). Capa e modelo de página têm os mesmos limites (A4 inteira).
export const IMAGENS_ANAIS = {
  capa: { recomendada: { largura: 2480, altura: 3508 }, minima: { largura: 1240, altura: 1754 }, dimensaoMax: 3508 },
  faixa: { larguraRecomendada: 2480, larguraMinima: 1240, dimensaoMax: 2480, proporcaoMax: 150 / 595.28 },
};

// Avisos (não bloqueantes) sobre a imagem escolhida.
export function avisosImagemAnais(tipo, dimensoes) {
  if (!dimensoes?.largura || !dimensoes?.altura) return [];
  const avisos = [];
  if (tipo === "capa" || tipo === "pagina") {
    const { minima } = IMAGENS_ANAIS.capa;
    if (Math.abs(dimensoes.altura / dimensoes.largura - 297 / 210) > 0.02) {
      avisos.push(
        "A proporção da imagem é diferente do A4 retrato (210 × 297). Ela vai preencher a página inteira, mas as bordas serão cortadas."
      );
    }
    if (dimensoes.largura < minima.largura || dimensoes.altura < minima.altura) {
      avisos.push(`A resolução está abaixo do mínimo (${minima.largura} × ${minima.altura} px) e pode sair pixelada.`);
    }
    return avisos;
  }
  const { larguraMinima, proporcaoMax } = IMAGENS_ANAIS.faixa;
  if (dimensoes.altura / dimensoes.largura > proporcaoMax) {
    avisos.push(
      "A imagem é alta demais para uma faixa (mais de 5,3 cm na largura da página). Ela será reduzida e centralizada, sem ocupar a largura toda."
    );
  }
  if (dimensoes.largura < larguraMinima) {
    avisos.push(`A largura está abaixo do mínimo (${larguraMinima} px) e a faixa pode sair pixelada.`);
  }
  return avisos;
}
