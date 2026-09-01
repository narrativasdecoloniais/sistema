import { apiClient } from "@/lib/apiClient";

export async function listarEdicoesInscricoes() {
  const dados = await apiClient.get("/participante/inscricoes");
  return dados?.inscricoes || [];
}

export function buscarInscricaoEdicao(edicaoId) {
  return apiClient.get(`/participante/inscricoes/${edicaoId}`);
}

export function salvarInscricao(edicaoId, atividadeIds) {
  return apiClient.post(`/participante/inscricoes/${edicaoId}`, { atividadeIds });
}

export function cancelarInscricaoAtividade(edicaoId, inscricaoAtividadeId) {
  return apiClient.delete(`/participante/inscricoes/${edicaoId}/atividades/${inscricaoAtividadeId}`);
}

export function cancelarInscricaoGeral(edicaoId) {
  return apiClient.delete(`/participante/inscricoes/${edicaoId}`);
}
