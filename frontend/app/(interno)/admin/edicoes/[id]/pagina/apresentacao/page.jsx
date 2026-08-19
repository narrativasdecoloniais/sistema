import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import TextoSecaoForm from "@/components/interno/TextoSecaoForm";

export default async function PaginaApresentacao({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "PAGINA_APRESENTACAO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  return (
    <TextoSecaoForm
      edicaoInicial={edicao}
      campo="Apresentacao"
      titulo="Apresentação"
      descricao="Título e texto da seção 'Sobre o evento' na página pública."
      temBotao
    />
  );
}
