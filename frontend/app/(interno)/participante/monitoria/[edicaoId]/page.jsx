import { obterUsuarioAtual } from "@/lib/auth";
import MonitoriaParticipantePainel from "@/components/interno/MonitoriaParticipantePainel";

export default async function PaginaMonitoriaEdicao({ params }) {
  const usuario = await obterUsuarioAtual();

  return <MonitoriaParticipantePainel edicaoId={params.edicaoId} usuario={usuario} />;
}
