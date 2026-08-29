// Cálculo de contraste WCAG 2.1 (relative luminance) a partir de hex —
// usado no admin pra avisar (sem bloquear) combinações de fundo/texto/búzio
// da Hero abaixo do mínimo do DESIGN.md.
function hexParaRgb(hex) {
  const valor = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(valor.slice(i, i + 2), 16));
}

export function luminanciaRelativa(hex) {
  const [r, g, b] = hexParaRgb(hex).map((c) => c / 255);
  const [rl, gl, bl] = [r, g, b].map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

export function contraste(hexA, hexB) {
  const [claro, escuro] = [luminanciaRelativa(hexA), luminanciaRelativa(hexB)].sort((a, b) => b - a);
  return (claro + 0.05) / (escuro + 0.05);
}

// Simula o color-mix(in srgb, hexPrimeiro <percentualPrimeiro>%, hexFundo)
// aplicado em .hero (ver page.module.scss) — usado pra calcular o contraste
// real depois que a opacidade do fundo da Hero entra na conta, em vez de
// tratar a cor escolhida como sempre 100% opaca.
export function misturar(hexPrimeiro, percentualPrimeiro, hexFundo) {
  const a = hexParaRgb(hexPrimeiro);
  const b = hexParaRgb(hexFundo);
  const p = percentualPrimeiro / 100;
  const canal = (i) => Math.round(a[i] * p + b[i] * (1 - p));
  return `#${[0, 1, 2].map((i) => canal(i).toString(16).padStart(2, "0")).join("")}`;
}
