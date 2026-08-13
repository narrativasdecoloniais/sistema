import { redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import PaginaEmBreve from "@/components/interno/PaginaEmBreve";

export default async function PaginaSubmissoesPublicacao({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "SUBMISSOES_PUBLICACAO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  return (
    <PaginaEmBreve
      titulo="Publicação dos trabalhos"
      descricao="Em breve você vai poder publicar os trabalhos e anais desta edição por aqui."
    />
  );
}
