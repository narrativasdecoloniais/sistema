import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { buscarCredenciamento } from "@/lib/credenciamentoAdmin";
import CredenciamentoPainel from "@/components/interno/CredenciamentoPainel";

export default async function PaginaCredenciamento({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "CREDENCIAMENTO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const dados = await buscarCredenciamento(params.id);

  return <CredenciamentoPainel edicaoId={params.id} dadosIniciais={dados} />;
}
