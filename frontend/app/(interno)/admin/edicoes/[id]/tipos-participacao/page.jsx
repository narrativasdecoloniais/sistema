import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPapel } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarTiposParticipacao } from "@/lib/tiposParticipacao";
import TiposParticipacaoPainel from "@/components/interno/TiposParticipacaoPainel";

export default async function PaginaTiposParticipacao({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPapel(usuario, "ADMIN")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const tipos = await listarTiposParticipacao();

  return <TiposParticipacaoPainel tiposIniciais={tipos} />;
}
