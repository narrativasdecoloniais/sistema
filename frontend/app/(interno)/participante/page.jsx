import { obterUsuarioAtual } from "@/lib/auth";
import { temPapel } from "@/lib/permissoes";
import InicioParticipantePainel from "@/components/interno/InicioParticipantePainel";

export default async function PaginaInicioParticipante() {
  const usuario = await obterUsuarioAtual();
  return <InicioParticipantePainel nome={usuario?.nome} avaliador={temPapel(usuario, "AVALIADOR")} />;
}
