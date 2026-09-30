// "Relações étnico-raciais na escola!" -> "relacoes-etnico-raciais-na-escola".
// Limitado a `maximo` caracteres sem cortar no meio de uma palavra quando dá.
function gerarSlug(texto, maximo = 80) {
  const base = String(texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (base.length <= maximo) return base;
  const cortado = base.slice(0, maximo);
  const ultimoHifen = cortado.lastIndexOf("-");
  return (ultimoHifen > maximo / 2 ? cortado.slice(0, ultimoHifen) : cortado).replace(/-+$/g, "");
}

module.exports = { gerarSlug };
