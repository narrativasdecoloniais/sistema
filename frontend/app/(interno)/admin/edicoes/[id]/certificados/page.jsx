import { redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import PaginaEmBreve from "@/components/interno/PaginaEmBreve";

export default async function PaginaCertificados({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "CERTIFICADOS")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  return (
    <PaginaEmBreve
      titulo="Certificados"
      descricao="Em breve você vai poder emitir e configurar os certificados desta edição por aqui."
    />
  );
}
