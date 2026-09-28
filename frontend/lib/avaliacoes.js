// Rótulos compartilhados entre o painel admin e a área do avaliador.
export const DECISOES_AVALIACAO = [
  { valor: "APROVADO", rotulo: "Aprovado" },
  { valor: "APROVADO_COM_RESSALVAS", rotulo: "Aprovado com ressalvas" },
  { valor: "APROVADO_FORMATACAO", rotulo: "Aprovado — validar formatação" },
  { valor: "REPROVADO", rotulo: "Reprovado" },
];

export const ROTULOS_DECISAO = Object.fromEntries(DECISOES_AVALIACAO.map((d) => [d.valor, d.rotulo]));

export const STATUS_AVALIADOR = [
  { valor: "PENDENTE", rotulo: "Pendente" },
  { valor: "AVALIADA", rotulo: "Avaliada" },
  { valor: "TROCA_SUGERIDA", rotulo: "Troca de área sugerida" },
  { valor: "ENCERRADA", rotulo: "Encerrada" },
];

export const ROTULOS_STATUS_AVALIADOR = Object.fromEntries(STATUS_AVALIADOR.map((s) => [s.valor, s.rotulo]));

export const STATUS_SUGESTAO = [
  { valor: "PENDENTE", rotulo: "Pendente" },
  { valor: "APROVADA", rotulo: "Aprovada" },
  { valor: "RECUSADA", rotulo: "Recusada" },
];

export const ROTULOS_STATUS_SUGESTAO = Object.fromEntries(STATUS_SUGESTAO.map((s) => [s.valor, s.rotulo]));

// Fluxo de correção pedido no resultado (ressalvas e formatação).
export const STATUS_CORRECAO = [
  { valor: "PENDENTE", rotulo: "Aguardando o autor" },
  { valor: "ENVIADA", rotulo: "Correção enviada" },
  { valor: "DEVOLVIDA", rotulo: "Devolvida ao autor" },
  { valor: "CONCLUIDA", rotulo: "Concluída" },
];

export const ROTULOS_STATUS_CORRECAO = Object.fromEntries(STATUS_CORRECAO.map((s) => [s.valor, s.rotulo]));

// Prazo de correção é só dia, gravado como meia-noite UTC (ver
// backend/src/utils/prazoCorrecao.js).
export function formatarPrazoCorrecao(prazo) {
  if (!prazo) return "";
  const [ano, mes, dia] = new Date(prazo).toISOString().slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}
