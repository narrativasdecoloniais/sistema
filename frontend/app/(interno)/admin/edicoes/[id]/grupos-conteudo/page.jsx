import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarGrupos } from "@/lib/gruposConteudo";
import GruposConteudoPainel from "@/components/interno/GruposConteudoPainel";

export default async function PaginaGruposConteudo({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "GRUPOS_CONTEUDO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const grupos = await listarGrupos(params.id);

  return <GruposConteudoPainel edicaoId={params.id} gruposIniciais={grupos} />;
}
