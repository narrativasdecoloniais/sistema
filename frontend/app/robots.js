import { URL_SITE } from "@/lib/anais";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Área logada, editor e fluxos de conta não têm o que indexar.
      disallow: ["/admin", "/participante", "/editor", "/login", "/cadastro", "/definir-senha", "/redefinir-senha"],
    },
    sitemap: `${URL_SITE}/sitemap.xml`,
  };
}
