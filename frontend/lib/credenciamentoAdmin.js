import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function requisitarComCookies(caminho) {
  const cookieHeader = cookies().toString();
  if (!cookieHeader) return null;
  const resposta = await fetch(`${API_URL}${caminho}`, { headers: { Cookie: cookieHeader }, cache: "no-store" });
  if (!resposta.ok) return null;
  return resposta.json();
}

// Carga inicial da tela de Credenciamento (server component).
export async function buscarCredenciamento(edicaoId) {
  const [evento, atividades] = await Promise.all([
    requisitarComCookies(`/edicoes/${edicaoId}/credenciamento`),
    requisitarComCookies(`/edicoes/${edicaoId}/credenciamento/atividades`),
  ]);
  if (!evento || !atividades) return null;
  return { ...evento, atividades: atividades.atividades };
}
