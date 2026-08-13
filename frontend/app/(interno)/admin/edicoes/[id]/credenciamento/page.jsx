import { redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import PaginaEmBreve from "@/components/interno/PaginaEmBreve";

export default async function PaginaCredenciamento({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "CREDENCIAMENTO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  return (
    <PaginaEmBreve
      titulo="Credenciamento"
      descricao="Em breve você vai poder acompanhar o credenciamento por QR code desta edição por aqui."
    />
  );
}
