import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { buscarMonitoria } from "@/lib/monitoriaAdmin";
import MonitoriaPainel from "@/components/interno/MonitoriaPainel";

export default async function PaginaMonitoria({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "MONITORIA")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const dados = await buscarMonitoria(params.id);

  return <MonitoriaPainel edicaoId={params.id} dadosIniciais={dados} />;
}
