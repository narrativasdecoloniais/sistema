import { z } from "zod";
import { luminanciaRelativa } from "./contraste";

// Paleta curada (DESIGN.md) — mesmos 7 valores dos enums CorSecao/CorPublica
// do schema Prisma (que armazenam string livre desde que aceitem cor
// personalizada, ver CampoCorSecao.jsx). Duplicada aqui como em
// _tokens-publico.scss/CampoCorSecao.jsx — não há uma fonte única
// compartilhada entre CSS e JS neste projeto.
export const PALETA_PUBLICA = ["TINTA", "BARRO", "OCRE", "BUZIO", "AREIA", "PAPEL", "CERRADO"];

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

export function ehCorPersonalizada(valor) {
  return typeof valor === "string" && HEX_REGEX.test(valor);
}

// Todo campo de cor aceita ou um token da paleta curada (ex. "BARRO") ou um
// hex literal (ex. "#3366CC") escolhido livremente no seletor "Personalizada"
// de CampoCorSecao.jsx.
export const corSchema = z.union([z.enum(PALETA_PUBLICA), z.string().regex(HEX_REGEX)]).optional();

// Resolve um valor de campo de cor pro hex de fato: passthrough se já for
// hex (cor personalizada), ou busca na tabela de opções (paleta curada) —
// substitui os `corPorValor` que antes existiam duplicados em cada tela do
// admin.
export function resolverCorHex(valor, opcoes) {
  if (ehCorPersonalizada(valor)) return valor;
  return opcoes.find((opcao) => opcao.valor === valor)?.cor;
}

const TINTA_HEX = "#201914";
const PAPEL_HEX = "#FAF6EE";

// Realizadores/Apoio não têm campo de texto próprio — a cor de texto é
// derivada da cor de fundo escolhida (ver .realizadores/.apoio em
// page.module.scss, que já embutem essa mesma regra por token da paleta
// curada). Pra uma cor de fundo personalizada não há par pré-calculado em
// CSS, então replicamos a mesma decisão (fundo claro -> texto tinta, fundo
// escuro -> texto papel) aqui a partir da luminância.
export function corTextoLegivel(hexFundo) {
  return luminanciaRelativa(hexFundo) > 0.5 ? TINTA_HEX : PAPEL_HEX;
}

// Filtra um mapa "--variavel-css" -> valorDoCampo só pelas entradas que são
// cor personalizada, prontas pra espalhar num `style` — os tokens da paleta
// curada continuam resolvidos pelos seletores de atributo já existentes em
// page.module.scss/BarraNavegacao.module.scss; isso só cobre o caso que eles
// não conseguem expressar (hex arbitrário não é enumerável em SCSS), e o
// `style` inline sempre vence a cascata sobre esses seletores.
export function estiloCoresPersonalizadas(mapa) {
  return Object.fromEntries(Object.entries(mapa).filter(([, valor]) => ehCorPersonalizada(valor)));
}
