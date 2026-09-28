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

export async function buscarResumoResultado(edicaoId) {
  const dados = await requisitarComCookies(`/edicoes/${edicaoId}/resultado`);
  return dados?.resumo || null;
}

export async function listarTrabalhosResultado(edicaoId) {
  const dados = await requisitarComCookies(`/edicoes/${edicaoId}/resultado/trabalhos`);
  return dados?.trabalhos || [];
}

export async function listarModelosEmailResultado(edicaoId) {
  const dados = await requisitarComCookies(`/edicoes/${edicaoId}/resultado/modelos-email`);
  return { modelos: dados?.modelos || [], marcadores: dados?.marcadores || [] };
}
