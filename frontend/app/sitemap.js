import { URL_SITE } from "@/lib/anais";
import { listarSitemapAnais } from "@/lib/anaisServidor";

// Gerado a cada requisição: os Anais mudam sem novo deploy (publicar,
// ocultar trabalho, corrigir texto).
export const dynamic = "force-dynamic";

export default async function sitemap() {
  const edicoes = await listarSitemapAnais();
  const entradas = [
    { url: `${URL_SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${URL_SITE}/anais`, changeFrequency: "monthly", priority: 0.8 },
  ];
  for (const edicao of edicoes) {
    entradas.push({
      url: `${URL_SITE}/anais/${edicao.slug}`,
      lastModified: edicao.atualizadoEm,
      changeFrequency: "monthly",
      priority: 0.8,
    });
    for (const artigo of edicao.artigos) {
      entradas.push({
        url: `${URL_SITE}/anais/${edicao.slug}/${artigo.slug}`,
        lastModified: artigo.atualizadoEm,
        changeFrequency: "yearly",
        priority: 0.6,
      });
    }
  }
  return entradas;
}
