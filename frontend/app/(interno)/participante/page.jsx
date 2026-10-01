import { obterUsuarioAtual } from "@/lib/auth";
import InicioParticipantePainel from "@/components/interno/InicioParticipantePainel";

export default async function PaginaInicioParticipante() {
  const usuario = await obterUsuarioAtual();
  return <InicioParticipantePainel nome={usuario?.nome} />;
}
