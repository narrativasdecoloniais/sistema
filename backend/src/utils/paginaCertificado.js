// Página de cada tipo de certificado, em mm: os certificados são A4 paisagem;
// a carta de aceite, A4 retrato. Espelhado em frontend/lib/certificados.js
// (paginaCertificado) — mudou um, muda o outro.

const PAISAGEM = { largura: 297, altura: 210 };
const RETRATO = { largura: 210, altura: 297 };

const TIPOS_RETRATO = ["CARTA_ACEITE"];

function paginaCertificado(tipo) {
  return TIPOS_RETRATO.includes(tipo) ? RETRATO : PAISAGEM;
}

// QR code em posição livre (esquerdaQr/topoQr = canto superior esquerdo do
// QR, em mm). Embaixo dele vai o código escrito em 7 pt, numa faixa de
// ESPACO_CODIGO_QR_MM de altura e pelo menos LARGURA_MIN_CODIGO_QR_MM de
// largura (cabe "Código de validação" e o código de 12 caracteres).
const TAMANHO_CODIGO_QR_PT = 7;
const ESPACO_CODIGO_QR_MM = 7;
const LARGURA_MIN_CODIGO_QR_MM = 42.5;

// Faixa do código: alinhada ao QR conforme alinhamentoCodigoQr e empurrada
// pra dentro da página se o QR estiver colado numa borda. Em mm.
function faixaCodigoQr({ esquerdaQr, tamanhoQr, alinhamentoCodigoQr }, pagina) {
  const largura = Math.max(tamanhoQr, LARGURA_MIN_CODIGO_QR_MM);
  let esquerda = esquerdaQr;
  if (alinhamentoCodigoQr === "DIREITA") esquerda = esquerdaQr + tamanhoQr - largura;
  else if (alinhamentoCodigoQr === "CENTRO") esquerda = esquerdaQr + (tamanhoQr - largura) / 2;
  esquerda = Math.min(Math.max(0, esquerda), pagina.largura - largura);
  return { esquerda, largura };
}

// Posição padrão: canto inferior direito, a 12 mm das bordas.
function posicaoQrPadrao(pagina, tamanhoQr) {
  return {
    esquerdaQr: pagina.largura - 12 - tamanhoQr,
    topoQr: pagina.altura - 12 - ESPACO_CODIGO_QR_MM - tamanhoQr,
    alinhamentoCodigoQr: "DIREITA",
  };
}

module.exports = {
  paginaCertificado,
  faixaCodigoQr,
  posicaoQrPadrao,
  TAMANHO_CODIGO_QR_PT,
  ESPACO_CODIGO_QR_MM,
};
