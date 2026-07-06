import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Só pode ser usado em Server Components — encaminha os cookies da requisição
// atual para a API, já que o fetch do servidor não tem acesso ao cookie jar do browser.
export async function obterUsuarioAtual() {
  const cookieHeader = cookies().toString();
  if (!cookieHeader) return null;

  const resposta = await fetch(`${API_URL}/usuarios/me`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });

  if (!resposta.ok) return null;

  const dados = await resposta.json();
  return dados.usuario;
}

export function temPapel(usuario, ...papeis) {
  return Boolean(usuario?.papeis?.some((papel) => papeis.includes(papel)));
}
