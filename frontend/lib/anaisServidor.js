import { cache } from "react";

// Consultas públicas dos Anais para Server Components. cache() evita buscar
// duas vezes na mesma requisição (generateMetadata + página).

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function requisitar(caminho) {
  try {
    const resposta = await fetch(`${API_URL}${caminho}`, { cache: "no-store" });
    if (!resposta.ok) return null;
    return await resposta.json();
  } catch {
    return null;
  }
}

export const listarEdicoesComAnais = cache(async () => {
  const dados = await requisitar("/publico/anais");
  return dados?.edicoes || [];
});

export const buscarAnaisDaEdicao = cache(async (edicaoSlug) =>
  requisitar(`/publico/anais/${encodeURIComponent(edicaoSlug)}`)
);

export const buscarArtigoDosAnais = cache(async (edicaoSlug, artigoSlug) =>
  requisitar(`/publico/anais/${encodeURIComponent(edicaoSlug)}/artigos/${encodeURIComponent(artigoSlug)}`)
);

export async function listarSitemapAnais() {
  const dados = await requisitar("/publico/anais/sitemap");
  return dados?.edicoes || [];
}
