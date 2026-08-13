import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPapel, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarTiposParticipacao } from "@/lib/tiposParticipacao";
import TiposParticipacaoPainel from "@/components/interno/TiposParticipacaoPainel";

export default async function PaginaTiposParticipacao({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "TIPOS_PARTICIPACAO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const tipos = await listarTiposParticipacao();

  return <TiposParticipacaoPainel tiposIniciais={tipos} podeEditar={temPapel(usuario, "ADMIN")} />;
}
