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

// { edicao, anais, artigo } no mesmo formato da página pública dos Anais.
export function buscarPreviaSubmissao(id) {
  return apiClient.get(`/participante/submissoes/${id}/previa`);
}

export async function corrigirSubmissao(id, dados) {
  const resposta = await apiClient.patch(`/participante/submissoes/${id}/correcao`, dados);
  return resposta?.submissao;
}
