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

export async function listarSubmissoes(edicaoId) {
  const dados = await requisitarComCookies(`/edicoes/${edicaoId}/submissoes`);
  return dados?.submissoes || [];
}

export async function buscarConteudoSubmissao(edicaoId, submissaoId) {
  const dados = await requisitarComCookies(`/edicoes/${edicaoId}/submissoes/${submissaoId}/conteudo`);
  return dados?.submissao || null;
}

export async function listarCoautores(edicaoId) {
  const dados = await requisitarComCookies(`/edicoes/${edicaoId}/coautores`);
  return { coautores: dados?.coautores || [], envio: dados?.envio || { enviando: false, naFila: 0 } };
}
