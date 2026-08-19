import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarModalidadesSubmissao } from "@/lib/modalidadesSubmissao";
import ModalidadesSubmissaoPainel from "@/components/interno/ModalidadesSubmissaoPainel";

export default async function PaginaModalidadesSubmissao({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "SUBMISSOES_MODALIDADES")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const modalidades = await listarModalidadesSubmissao(params.id);

  return <ModalidadesSubmissaoPainel edicaoId={params.id} modalidadesIniciais={modalidades} />;
}
