import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import TextoSecaoForm from "@/components/interno/TextoSecaoForm";

export default async function PaginaPublicacoes({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "PAGINA_PUBLICACOES")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  return (
    <TextoSecaoForm
      edicaoInicial={edicao}
      campo="Publicacoes"
      titulo="Publicações"
      descricao="Título e texto da seção 'Anais e Memória' na página pública."
    />
  );
}
