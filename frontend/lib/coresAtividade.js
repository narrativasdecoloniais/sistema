// Paleta qualitativa dedicada à agenda de programação — tons na mesma
// família terrosa/dessaturada da pele interna (_tokens-interno.scss), mas
// numerosa o suficiente pra distinguir várias trilhas (tipos de atividade)
// lado a lado na grade. Não reaproveita a paleta pública (CorPublica) nem os
// 4 tokens semânticos do admin (acento/sucesso/alerta/erro — poucos demais
// pra categorizar tipos de atividade).
const PALETA_BASE = [
  "#a05c3b", // terracota
  "#5c7a4e", // verde-oliva
  "#b98a3a", // ocre
  "#4a6b7a", // azul-acinzentado
  "#7a5c8a", // ameixa
  "#8a6a4a", // marrom-areia
  "#5c8a7a", // verde-água acinzentado
  "#8a4a5c", // bordô-acinzentado
];

const COR_PADRAO = "#7a7166";

function hexParaRgb(hex) {
  const valor = hex.replace("#", "");
  const inteiro = parseInt(valor, 16);
  return { r: (inteiro >> 16) & 255, g: (inteiro >> 8) & 255, b: inteiro & 255 };
}

function rgbParaHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function rgbParaHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslParaRgb({ h, s, l }) {
  const hn = h / 360;
  const sn = s / 100;
  const ln = l / 100;

  if (sn === 0) {
    const cinza = ln * 255;
    return { r: cinza, g: cinza, b: cinza };
  }

  const hue2rgb = (p, q, t) => {
    let tn = t;
    if (tn < 0) tn += 1;
    if (tn > 1) tn -= 1;
    if (tn < 1 / 6) return p + (q - p) * 6 * tn;
    if (tn < 1 / 2) return q;
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
    return p;
  };

  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;

  return {
    r: hue2rgb(p, q, hn + 1 / 3) * 255,
    g: hue2rgb(p, q, hn) * 255,
    b: hue2rgb(p, q, hn - 1 / 3) * 255,
  };
}

// Ajusta só a luminosidade (mantém matiz/saturação), com limites que evitam
// tons claros demais (texto branco por cima ficaria ilegível) ou escuros
// demais (perde a identidade da cor base).
function ajustarLuminosidade(hex, delta) {
  const hsl = rgbParaHsl(hexParaRgb(hex));
  const novoL = Math.min(72, Math.max(24, hsl.l + delta));
  return rgbParaHex(hslParaRgb({ ...hsl, l: novoL }));
}

// Um tom por tipo de atividade, garantido sem colisão: os primeiros N
// tipos (N = tamanho da paleta base) recebem uma cor cada, sem repetir.
// A partir daí, deriva variações mais claras/escuras dos tons base
// (alternando +14%, -14%, +28%, -28%L...) em vez de repetir uma cor já
// usada por outro tipo. Determinístico entre sessões/recarregamentos: a
// mesma lista de tipos sempre produz o mesmo mapa, sem persistir nada.
export function criarMapaCores(tiposAtividade = []) {
  const nomes = [...new Set(tiposAtividade.map((tipo) => tipo.nome).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  const mapa = new Map();

  nomes.forEach((nome, indice) => {
    const corBase = PALETA_BASE[indice % PALETA_BASE.length];
    const nivel = Math.floor(indice / PALETA_BASE.length);

    if (nivel === 0) {
      mapa.set(nome, corBase);
      return;
    }

    const grupo = Math.ceil(nivel / 2);
    const direcao = nivel % 2 === 1 ? 1 : -1;
    mapa.set(nome, ajustarLuminosidade(corBase, direcao * grupo * 14));
  });

  return mapa;
}

export function corPorMapa(mapaCores, nomeTipo) {
  return mapaCores.get(nomeTipo) || COR_PADRAO;
}
