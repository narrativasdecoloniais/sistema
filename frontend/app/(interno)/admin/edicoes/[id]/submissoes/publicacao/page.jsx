import { redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarPainelAnais, listarArtigosAnaisAdmin, listarComentariosAnaisAdmin } from "@/lib/anaisAdmin";
import AnaisPainel from "@/components/interno/anais/AnaisPainel";

export const metadata = { title: "Anais" };

export default async function PaginaSubmissoesPublicacao({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "SUBMISSOES_PUBLICACAO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  // O painel sincroniza os trabalhos que entraram no critério antes de listar.
  const painel = await buscarPainelAnais(params.id);
  const [artigos, comentarios] = await Promise.all([
    listarArtigosAnaisAdmin(params.id),
    listarComentariosAnaisAdmin(params.id),
  ]);

  return (
    <AnaisPainel
      edicaoId={params.id}
      painelInicial={painel}
      artigosIniciais={artigos}
      comentariosIniciais={comentarios}
    />
  );
}
