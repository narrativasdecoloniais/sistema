import { apiClient } from "@/lib/apiClient";

export async function listarMinhasAvaliacoes() {
  const dados = await apiClient.get("/participante/avaliacoes");
  return dados?.avaliacoes || [];
}

export async function buscarAvaliacao(id) {
  const dados = await apiClient.get(`/participante/avaliacoes/${id}`);
  return dados?.avaliacao;
}

export async function registrarDecisao(id, decisao) {
  const dados = await apiClient.patch(`/participante/avaliacoes/${id}/decisao`, { decisao });
  return dados?.avaliacao;
}

export async function sugerirArea(id, dados) {
  const resposta = await apiClient.post(`/participante/avaliacoes/${id}/sugestao-area`, dados);
  return resposta?.avaliacao;
}
