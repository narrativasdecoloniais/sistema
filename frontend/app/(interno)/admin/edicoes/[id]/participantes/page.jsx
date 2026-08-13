import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarParticipantes } from "@/lib/participantes";
import ParticipantesPainel from "@/components/interno/ParticipantesPainel";

export default async function PaginaParticipantes({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "PARTICIPANTES")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const participantes = await listarParticipantes();

  return <ParticipantesPainel participantesIniciais={participantes} usuarioLogado={usuario} />;
}
