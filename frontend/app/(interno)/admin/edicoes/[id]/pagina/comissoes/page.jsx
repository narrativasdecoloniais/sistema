import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import TextoSecaoForm from "@/components/interno/TextoSecaoForm";

export default async function PaginaComissoesEstilo({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "PAGINA_COMISSOES")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  return (
    <TextoSecaoForm
      edicaoInicial={edicao}
      campo="Comissoes"
      titulo="Comissões"
      descricao="Título e texto da seção 'Comissões' na página pública."
    />
  );
}
