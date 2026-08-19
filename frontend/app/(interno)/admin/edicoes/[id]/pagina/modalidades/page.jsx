import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import TextoSecaoForm from "@/components/interno/TextoSecaoForm";

export default async function PaginaModalidades({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "PAGINA_MODALIDADES")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  return (
    <TextoSecaoForm
      edicaoInicial={edicao}
      campo="Modalidades"
      titulo="Modalidades"
      descricao="Título e texto de introdução da seção 'Submissão' na página pública. Os cards de cada modalidade continuam vindo do cadastro fixo de modalidades."
      temCard
      temBotao
    />
  );
}
