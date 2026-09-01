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
