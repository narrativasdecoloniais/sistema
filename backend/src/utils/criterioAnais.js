// Critérios de quais submissões podem ficar públicas — toda consulta pública
// de trabalhos (Anais) passa por aqui.

// Só publica trabalho efetivamente apresentado: pelo menos um dos autores
// (com conta vinculada à autoria) se credenciou no evento da própria edição.
// Coautor sem conta não tem como ter se credenciado.
function filtroAlgumAutorCredenciado(edicaoId) {
  return {
    autores: {
      some: { usuario: { inscricoesEdicao: { some: { edicaoId, credenciadoEm: { not: null } } } } },
    },
  };
}

// Anais. Provisório: por enquanto só existem trabalhos "aprovados para
// formatação" na base, então é esse o status publicado (sem exigir que o
// autor já tenha validado a formatação). Quando houver aprovados de fato,
// trocar para { decisaoFinal: "APROVADO" } (ou incluir os demais com
// statusCorrecao CONCLUIDA, como FILTRO_APROVADO em certificadosElegiveis.js).
function filtroSubmissoesAnais(edicaoId) {
  return { decisaoFinal: { in: ["APROVADO_FORMATACAO"] }, ...filtroAlgumAutorCredenciado(edicaoId) };
}

module.exports = { filtroAlgumAutorCredenciado, filtroSubmissoesAnais };
