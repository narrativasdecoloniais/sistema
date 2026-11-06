// A ordem dos trabalhos numa atividade (Submissao.ordemApresentacao) existe
// sempre para a organização, mas só é divulgada aos autores e ao público
// quando a edição liga Edicao.apresentacaoComOrdem. Desligada, o campo sai
// nulo e a lista vai por título — a ordem interna não pode sugerir uma
// sequência que não vai acontecer. Os fronts só reagem a `ordemApresentacao`
// nulo (sem numeração).
function projetarOrdemApresentacao(trabalhos, edicao) {
  if (edicao?.apresentacaoComOrdem) return trabalhos;
  return trabalhos
    .map((trabalho) => ({ ...trabalho, ordemApresentacao: null }))
    .sort((a, b) => (a.titulo || "").localeCompare(b.titulo || "", "pt-BR", { sensitivity: "base" }));
}

module.exports = { projetarOrdemApresentacao };
