import { redirect } from "next/navigation";
import { buscarEdicaoAtual } from "@/lib/publico";

// Atalho estável (menu, página pública /monitoria): leva à monitoria da
// edição atual.
export default async function PaginaMonitoriaParticipante() {
  const edicao = await buscarEdicaoAtual();
  redirect(edicao ? `/participante/monitoria/${edicao.id}` : "/participante");
}
