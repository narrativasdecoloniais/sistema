// Critério único de quais submissões entram nos Anais — toda consulta do
// módulo (admin, páginas públicas, PDF/Word, sitemap) passa por aqui.
//
// Provisório: por enquanto só existem trabalhos "aprovados para formatação"
// na base, então é esse o status publicado (sem exigir que o autor já tenha
// validado a formatação). Quando houver aprovados de fato, trocar para
// { decisaoFinal: "APROVADO" } (ou incluir os demais com statusCorrecao
// CONCLUIDA, como em publico.controller.js#listarTrabalhosAprovados).
const FILTRO_SUBMISSOES_ANAIS = { decisaoFinal: { in: ["APROVADO_FORMATACAO"] } };

module.exports = { FILTRO_SUBMISSOES_ANAIS };
