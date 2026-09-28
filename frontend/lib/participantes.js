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

// Endpoint backend continua em /organizadores (descreve contas com papel
// ORGANIZADOR/ADMIN) — só a camada frontend chama-se "participantes",
// alinhada com a tela que a consome.
export async function listarParticipantes() {
  const dados = await requisitarComCookies("/organizadores");
  return dados?.organizadores || [];
}

// Todos os usuários (menos anonimizados) com a situação na edição — inscrição
// geral e contagem de inscrições em atividades. Endpoint ADMIN-only: pra quem
// não é ADMIN, devolve 403 e aqui vira lista vazia.
export async function listarUsuariosDaEdicao(edicaoId) {
  const dados = await requisitarComCookies(`/edicoes/${edicaoId}/usuarios`);
  return dados?.usuarios || [];
}
