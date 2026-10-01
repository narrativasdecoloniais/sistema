import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarCoautores } from "@/lib/submissoesAdmin";
import CoautoresPainel from "@/components/interno/CoautoresPainel";

export default async function PaginaCoautores({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "SUBMISSOES_RECEBIMENTO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const { coautores, envio } = await listarCoautores(params.id);

  return <CoautoresPainel edicaoId={params.id} coautoresIniciais={coautores} envioInicial={envio} />;
}
