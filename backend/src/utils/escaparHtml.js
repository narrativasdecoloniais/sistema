// Escapa texto livre (nomes, títulos, observações) antes de interpolar em
// HTML de e-mail.
const MAPA = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function escaparHtml(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (caractere) => MAPA[caractere]);
}

module.exports = escaparHtml;
