import { z } from "zod";
import { cpfValido, formatarCpf } from "@/lib/cpf";

// Estrangeiros sem CPF se identificam pelo número do documento do próprio
// país (sem validação de formato) + país. Espelha
// backend/src/validators/identificacao.validators.js e utils/identificacao.js.

// ISO 3166-1 alfa-2, sem o Brasil (quem é do Brasil usa CPF). Nome em
// português vem do próprio navegador (Intl.DisplayNames).
const CODIGOS_PAISES =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(
    " "
  );

const nomesRegiao = new Intl.DisplayNames(["pt-BR"], { type: "region" });

export function nomePais(codigo) {
  if (!codigo) return "";
  try {
    return nomesRegiao.of(codigo) || codigo;
  } catch {
    return codigo;
  }
}

export const PAISES = CODIGOS_PAISES.map((codigo) => ({ codigo, nome: nomePais(codigo) })).sort((a, b) =>
  a.nome.localeCompare(b.nome, "pt-BR")
);

export function normalizarDocumento(documento) {
  return String(documento || "")
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export const IDENTIFICACAO_INICIAL = { tipoDocumento: "CPF", cpf: "", documento: "", pais: "" };

export const camposIdentificacao = {
  tipoDocumento: z.enum(["CPF", "ESTRANGEIRO"]).default("CPF"),
  cpf: z.string().optional(),
  documento: z.string().max(60, "Máximo de 60 caracteres").optional(),
  pais: z.string().optional(),
};

export function validarIdentificacao(dados, ctx) {
  if (dados.tipoDocumento === "ESTRANGEIRO") {
    if (normalizarDocumento(dados.documento).length < 3) {
      ctx.addIssue({ code: "custom", path: ["documento"], message: "Informe o número do documento" });
    }
    if (!/^[A-Z]{2}$/.test(dados.pais || "")) {
      ctx.addIssue({ code: "custom", path: ["pais"], message: "Selecione o país" });
    }
    return;
  }
  if (!cpfValido(dados.cpf || "")) {
    ctx.addIssue({ code: "custom", path: ["cpf"], message: "CPF inválido" });
  }
}

// Só os campos da identificação escolhida — para montar o corpo da requisição.
export function payloadIdentificacao({ tipoDocumento, cpf, documento, pais }) {
  return tipoDocumento === "ESTRANGEIRO" ? { tipoDocumento, documento, pais } : { tipoDocumento, cpf };
}

// "123.456.789-09" ou "AB123456 (Argentina)"; null se a conta não tem nenhum.
export function formatarIdentificacao(usuario) {
  if (usuario?.cpf) return formatarCpf(usuario.cpf);
  if (usuario?.documentoEstrangeiro) return `${usuario.documentoEstrangeiro} (${nomePais(usuario.pais)})`;
  return null;
}

export function temIdentificacao(usuario) {
  return Boolean(usuario?.cpf || usuario?.documentoEstrangeiro);
}
