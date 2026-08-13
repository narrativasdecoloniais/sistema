import { redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import PaginaEmBreve from "@/components/interno/PaginaEmBreve";

export default async function PaginaSubmissoesResultado({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "SUBMISSOES_RESULTADO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  return (
    <PaginaEmBreve
      titulo="Resultado das submissões"
      descricao="Em breve você vai poder divulgar o resultado da avaliação de trabalhos por aqui."
    />
  );
}
