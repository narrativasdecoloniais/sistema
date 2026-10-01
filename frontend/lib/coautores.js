// Situação do cadastro de um coautor — calculada no backend
// (convitesCoautor.service.js situacaoAutoria).
export const ROTULOS_SITUACAO_COAUTOR = {
  CADASTRADO: "Cadastrado(a)",
  CONVITE_ENVIADO: "Convite enviado",
  NA_FILA: "Convite na fila de envio",
  FALHA_ENVIO: "Falha no envio do convite",
  NAO_ENVIADO: "Convite não enviado",
};

export function formatarDataHoraCurta(valor) {
  if (!valor) return "";
  return new Date(valor).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
