import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function buscarApresentacao(edicaoId) {
  const cookieHeader = cookies().toString();
  if (!cookieHeader) return null;

  const resposta = await fetch(`${API_URL}/edicoes/${edicaoId}/apresentacao`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!resposta.ok) return null;
  return resposta.json();
}
