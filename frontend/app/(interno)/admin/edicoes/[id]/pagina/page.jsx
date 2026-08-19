import { redirect } from "next/navigation";

// "Página do evento" virou um grupo com 6 subitens (ver NavegacaoEdicao.jsx)
// — mantém essa URL antiga viva redirecionando pra primeira sub-rota.
export default function PaginaPaginaEvento({ params }) {
  redirect(`/admin/edicoes/${params.id}/pagina/hero`);
}
