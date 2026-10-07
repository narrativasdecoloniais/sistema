// Prazo de correção do resultado (Edicao.prazoCorrecaoSubmissao) é só dia,
// com a mesma convenção "ingênua" em UTC de prazoSubmissaoAberto.js: o dia
// do prazo conta inteiro como aberto.
const { hojeIngenuo } = require("./horarioBrasilia");

// "Hoje" é o dia de Brasília (horarioBrasilia.js).
function prazoCorrecaoAberto(prazo) {
  if (!prazo) return false;
  const hoje = hojeIngenuo();
  return hoje <= new Date(prazo).toISOString().slice(0, 10);
}

function formatarPrazoCorrecao(prazo) {
  if (!prazo) return "";
  const [ano, mes, dia] = new Date(prazo).toISOString().slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

// Situações em que o autor principal (re)envia a correção, sempre dentro do
// prazo: pendente ou devolvida; e a formatação já concluída, que pode ser
// revista enquanto os Anais não forem publicados — depois disso o texto já é
// público. Ressalvas enviadas/conferidas ficam com a organização.
function correcaoEditavel({ decisaoFinal, statusCorrecao }, { prazoCorrecaoSubmissao, anaisPublicados }) {
  if (!prazoCorrecaoAberto(prazoCorrecaoSubmissao)) return false;
  if (["PENDENTE", "DEVOLVIDA"].includes(statusCorrecao)) return true;
  return decisaoFinal === "APROVADO_FORMATACAO" && statusCorrecao === "CONCLUIDA" && !anaisPublicados;
}

module.exports = { prazoCorrecaoAberto, formatarPrazoCorrecao, correcaoEditavel };
