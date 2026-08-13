import { redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import PaginaEmBreve from "@/components/interno/PaginaEmBreve";

export default async function PaginaSubmissoesRecebimento({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "SUBMISSOES_RECEBIMENTO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  return (
    <PaginaEmBreve
      titulo="Recebimento de submissões"
      descricao="Em breve você vai poder acompanhar os trabalhos recebidos desta edição por aqui."
    />
  );
}
