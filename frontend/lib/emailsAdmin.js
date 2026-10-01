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

export async function carregarPainelEmails(edicaoId) {
  const [modelos, envios, uso] = await Promise.all([
    requisitarComCookies("/emails/modelos"),
    requisitarComCookies(`/emails/envios?edicaoId=${encodeURIComponent(edicaoId)}`),
    requisitarComCookies("/emails/uso-mensal"),
  ]);
  return {
    modelos: modelos?.modelos || [],
    envios: envios?.envios || [],
    uso: uso || null,
  };
}
