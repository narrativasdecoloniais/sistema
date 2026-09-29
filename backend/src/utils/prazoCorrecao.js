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

module.exports = { prazoCorrecaoAberto, formatarPrazoCorrecao };
