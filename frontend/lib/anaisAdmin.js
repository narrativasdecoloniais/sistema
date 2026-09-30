import { cookies } from "next/headers";

// Leituras do painel admin dos Anais para Server Components (encaminham os
// cookies da sessão). As mutações ficam nos componentes, via apiClient.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function requisitarComCookies(caminho) {
  const cookieHeader = cookies().toString();
  if (!cookieHeader) return null;
  const resposta = await fetch(`${API_URL}${caminho}`, { headers: { Cookie: cookieHeader }, cache: "no-store" });
  if (!resposta.ok) return null;
  return resposta.json();
}

export async function buscarPainelAnais(edicaoId) {
  return requisitarComCookies(`/edicoes/${edicaoId}/anais`);
}

export async function listarArtigosAnaisAdmin(edicaoId) {
  const dados = await requisitarComCookies(`/edicoes/${edicaoId}/anais/artigos`);
  return dados?.artigos || [];
}

export async function listarComentariosAnaisAdmin(edicaoId) {
  const dados = await requisitarComCookies(`/edicoes/${edicaoId}/anais/comentarios`);
  return dados?.comentarios || [];
}
