import { apiClient } from "@/lib/apiClient";
import { idadeEm } from "@/lib/idade";
import { agoraIngenuo } from "@/lib/horarioBrasilia";

export { idadeEm };

// Funções do edital da V edição — pré-preenchem a lista da edição quando ela
// ainda está vazia (Configurações da Monitoria). Cada edição edita a sua.
export const FUNCOES_MONITORIA_PADRAO = [
  "Organização dos espaços e apoio à logística do evento",
  "Credenciamento e recepção do público",
  "Recepção e acompanhamento de pessoas convidadas",
  "Apoio às sessões do evento",
  "Tradução e interpretação de Libras",
  "Registro fotográfico e em vídeo",
  "Produção de conteúdo para publicação nas redes sociais",
  "Apoio às atividades para as infâncias",
];

// Textos genéricos (sem datas) dos 3 "Estou ciente de que", usados quando a
// edição ainda não tem os seus (cienteFormacaoMonitoria etc. nulos).
export const TEXTOS_CIENTE_MONITORIA_PADRAO = {
  cienteFormacaoMonitoria:
    "Preciso participar da formação virtual ou presencial de monitores, nas datas indicadas no edital.",
  cienteDisponibilidadeMonitoria: "Preciso ter disponibilidade para atuar presencialmente em todos os dias do evento.",
  cienteVoluntariaMonitoria: "A monitoria é voluntária e não implica em remuneração de qualquer tipo.",
};

export function textoCienteMonitoria(edicao, campo) {
  return edicao?.[campo] || TEXTOS_CIENTE_MONITORIA_PADRAO[campo];
}

export const ROTULOS_STATUS_MONITORIA = {
  EM_ANALISE: "Em análise",
  SELECIONADO: "Selecionado(a)",
  LISTA_ESPERA: "Lista de espera",
  NAO_SELECIONADO: "Não selecionado(a)",
  CANCELADA: "Cancelada",
};

// Espelho de backend/src/utils/inscricoesMonitoriaAbertas.js — só para
// exibição; quem decide é o backend.
export function monitoriaAberta(edicao) {
  if (!edicao?.inicioInscricoesMonitoria || !edicao?.fimInscricoesMonitoria) return false;
  const agora = agoraIngenuo();
  return agora >= new Date(edicao.inicioInscricoesMonitoria) && agora <= new Date(edicao.fimInscricoesMonitoria);
}

// A idade conta no primeiro dia do evento; sem data cadastrada, hoje.
export function dataReferenciaIdade(edicao) {
  return edicao?.dataInicio || new Date().toISOString();
}

export function ehMenor(dataNascimento, edicao) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento || "")) return false;
  return idadeEm(dataNascimento, dataReferenciaIdade(edicao)) < 18;
}

// Área do participante
export function buscarMinhaInscricaoMonitoria(edicaoId) {
  return apiClient.get(`/participante/monitoria/${edicaoId}`);
}

export function salvarInscricaoMonitoria(edicaoId, dados) {
  return apiClient.put(`/participante/monitoria/${edicaoId}`, dados);
}

export function cancelarInscricaoMonitoria(edicaoId) {
  return apiClient.delete(`/participante/monitoria/${edicaoId}`);
}

// Admin (seção MONITORIA)
export function listarMonitoria(edicaoId) {
  return apiClient.get(`/edicoes/${edicaoId}/monitoria`);
}

export function salvarConfiguracaoMonitoria(edicaoId, dados) {
  return apiClient.patch(`/edicoes/${edicaoId}/monitoria/configuracao`, dados);
}

export function definirStatusMonitoria(edicaoId, id, dados) {
  return apiClient.patch(`/edicoes/${edicaoId}/monitoria/${id}/status`, dados);
}

export function definirStatusMonitoriaEmLote(edicaoId, ids, status) {
  return apiClient.post(`/edicoes/${edicaoId}/monitoria/status-em-lote`, { ids, status });
}

export function buscarUrlAutorizacao(edicaoId, id) {
  return apiClient.get(`/edicoes/${edicaoId}/monitoria/${id}/autorizacao`);
}

export function divulgarResultadoMonitoria(edicaoId) {
  return apiClient.post(`/edicoes/${edicaoId}/monitoria/divulgar`, {});
}

export function reenviarEmailsMonitoria(edicaoId) {
  return apiClient.post(`/edicoes/${edicaoId}/monitoria/emails/reenviar`, {});
}
