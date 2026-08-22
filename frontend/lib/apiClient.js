const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Dedup: se várias requisições tomam 401 ao mesmo tempo (múltiplas abas ou
// chamadas em paralelo), só uma dispara o refresh — as demais reaproveitam a
// mesma promise em vez de rotacionar o refresh token várias vezes em corrida.
let renovacaoEmAndamento = null;

function renovarSessao() {
  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    })
      .then((resposta) => resposta.ok)
      .catch(() => false)
      .finally(() => {
        renovacaoEmAndamento = null;
      });
  }
  return renovacaoEmAndamento;
}

async function requisitar(caminho, { method = "GET", body } = {}, jaTentouRenovar = false) {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  // O access token dura só 15min; um 401 fora de /auth/* costuma significar
  // que ele expirou no meio da sessão, não que o usuário nunca esteve
  // logado. Tenta renovar via refresh token (válido por dias) e reenvia a
  // requisição original uma única vez antes de desistir.
  if (resposta.status === 401 && !jaTentouRenovar && !caminho.startsWith("/auth/")) {
    const renovou = await renovarSessao();
    if (renovou) {
      return requisitar(caminho, { method, body }, true);
    }
  }

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new Error(dados?.mensagem || "Ocorreu um erro. Tente novamente.");
  }

  return dados;
}

export const apiClient = {
  get: (caminho) => requisitar(caminho),
  post: (caminho, body) => requisitar(caminho, { method: "POST", body }),
  patch: (caminho, body) => requisitar(caminho, { method: "PATCH", body }),
  delete: (caminho) => requisitar(caminho, { method: "DELETE" }),
};
