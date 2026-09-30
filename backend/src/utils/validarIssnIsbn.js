// Normaliza e confere o dígito verificador de ISSN e ISBN. As funções
// devolvem a forma canônica (ISSN "1234-567X", ISBN só dígitos com hífens
// removidos) ou null quando o número é inválido. Espelhado em
// frontend/lib/validacao.js — mudou aqui, muda lá.

function normalizarIssn(valor) {
  const limpo = String(valor || "").toUpperCase().replace(/[^0-9X]/g, "");
  if (!/^\d{7}[\dX]$/.test(limpo)) return null;
  const soma = [...limpo.slice(0, 7)].reduce((total, digito, i) => total + Number(digito) * (8 - i), 0);
  const resto = (11 - (soma % 11)) % 11;
  const verificador = resto === 10 ? "X" : String(resto);
  if (verificador !== limpo[7]) return null;
  return `${limpo.slice(0, 4)}-${limpo.slice(4)}`;
}

function isbn10Valido(digitos) {
  if (!/^\d{9}[\dX]$/.test(digitos)) return false;
  const soma = [...digitos].reduce(
    (total, digito, i) => total + (digito === "X" ? 10 : Number(digito)) * (10 - i),
    0
  );
  return soma % 11 === 0;
}

function isbn13Valido(digitos) {
  if (!/^\d{13}$/.test(digitos)) return false;
  const soma = [...digitos].reduce((total, digito, i) => total + Number(digito) * (i % 2 === 0 ? 1 : 3), 0);
  return soma % 10 === 0;
}

// Mantém os hífens que a pessoa digitou (a hifenização do ISBN depende do
// grupo/editora e não dá pra recalcular); só confere os dígitos.
function normalizarIsbn(valor) {
  const texto = String(valor || "").toUpperCase().replace(/^ISBN[:\s]*/, "").trim();
  const digitos = texto.replace(/[^0-9X]/g, "");
  if (!(isbn13Valido(digitos) || isbn10Valido(digitos))) return null;
  return /^[\dX-]+$/.test(texto.replace(/\s/g, "-")) ? texto.replace(/\s+/g, "-") : digitos;
}

module.exports = { normalizarIssn, normalizarIsbn };
