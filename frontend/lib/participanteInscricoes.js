import { apiClient } from "@/lib/apiClient";

export async function listarEdicoesInscricoes() {
  const dados = await apiClient.get("/participante/inscricoes");
  return dados?.inscricoes || [];
}

export function buscarInscricaoEdicao(edicaoId) {
  return apiClient.get(`/participante/inscricoes/${edicaoId}`);
}

// `adaptacao` só é exigida na primeira inscrição (a que cria a inscrição geral).
export function salvarInscricao(edicaoId, atividadeIds, adaptacao) {
  return apiClient.post(`/participante/inscricoes/${edicaoId}`, { atividadeIds, adaptacao });
}

export function atualizarAdaptacao(edicaoId, adaptacao) {
  return apiClient.patch(`/participante/inscricoes/${edicaoId}/adaptacao`, adaptacao);
}

export function cancelarInscricaoAtividade(edicaoId, inscricaoAtividadeId) {
  return apiClient.delete(`/participante/inscricoes/${edicaoId}/atividades/${inscricaoAtividadeId}`);
}

export function cancelarInscricaoGeral(edicaoId) {
  return apiClient.delete(`/participante/inscricoes/${edicaoId}`);
}
