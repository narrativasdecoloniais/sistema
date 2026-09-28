import { apiClient } from "@/lib/apiClient";

export async function listarMinhasSubmissoes() {
  const dados = await apiClient.get("/participante/submissoes");
  return dados?.submissoes || [];
}

export async function criarSubmissao(dados) {
  const resposta = await apiClient.post("/participante/submissoes", dados);
  return resposta?.submissao;
}

export function verificarEmailAutor(email) {
  return apiClient.post("/participante/submissoes/verificar-email-autor", { email });
}

export async function buscarMinhaSubmissao(id) {
  const dados = await apiClient.get(`/participante/submissoes/${id}`);
  return dados?.submissao;
}

export async function corrigirSubmissao(id, dados) {
  const resposta = await apiClient.patch(`/participante/submissoes/${id}/correcao`, dados);
  return resposta?.submissao;
}
