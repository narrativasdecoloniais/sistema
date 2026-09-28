import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function requisitarComCookies(caminho) {
  const cookieHeader = cookies().toString();
  if (!cookieHeader) return null;

  const resposta = await fetch(`${API_URL}${caminho}`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });

  if (!resposta.ok) return null;
  return resposta.json();
}

export async function listarSubmissoesEmAvaliacao(edicaoId) {
  const dados = await requisitarComCookies(`/edicoes/${edicaoId}/avaliacoes/submissoes`);
  return dados?.submissoes || [];
}

export async function listarAvaliadores(edicaoId) {
  const dados = await requisitarComCookies(`/edicoes/${edicaoId}/avaliacoes/avaliadores`);
  return dados?.avaliadores || [];
}

export async function listarSugestoesTrocaArea(edicaoId) {
  const dados = await requisitarComCookies(`/edicoes/${edicaoId}/avaliacoes/sugestoes`);
  return dados?.sugestoes || [];
}
