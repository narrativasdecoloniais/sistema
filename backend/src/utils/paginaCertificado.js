// Página de cada tipo de certificado, em mm: os certificados são A4 paisagem;
// a carta de aceite, A4 retrato. Espelhado em frontend/lib/certificados.js
// (paginaCertificado) — mudou um, muda o outro.

const PAISAGEM = { largura: 297, altura: 210 };
const RETRATO = { largura: 210, altura: 297 };

const TIPOS_RETRATO = ["CARTA_ACEITE"];

function paginaCertificado(tipo) {
  return TIPOS_RETRATO.includes(tipo) ? RETRATO : PAISAGEM;
}

module.exports = { paginaCertificado };
