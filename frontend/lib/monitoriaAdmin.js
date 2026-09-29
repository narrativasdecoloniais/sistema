import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Carga inicial da tela de Monitoria no admin (server component).
export async function buscarMonitoria(edicaoId) {
  const cookieHeader = cookies().toString();
  if (!cookieHeader) return null;

  const resposta = await fetch(`${API_URL}/edicoes/${edicaoId}/monitoria`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!resposta.ok) return null;
  return resposta.json();
}
