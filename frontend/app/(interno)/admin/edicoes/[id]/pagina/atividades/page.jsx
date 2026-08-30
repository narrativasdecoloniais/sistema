import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import AparenciaAtividadesForm from "@/components/interno/AparenciaAtividadesForm";

export default async function PaginaAtividadesAparencia({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "PAGINA_ATIVIDADES")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  return <AparenciaAtividadesForm edicaoInicial={edicao} />;
}
