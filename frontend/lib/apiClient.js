const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function requisitar(caminho, { method = "GET", body } = {}) {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

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
