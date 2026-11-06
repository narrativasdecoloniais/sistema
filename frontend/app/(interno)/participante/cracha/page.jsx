import { redirect } from "next/navigation";

// "Meu crachá" virou a primeira aba de Credenciamento; a rota antiga continua
// valendo para links salvos e e-mails já enviados.
export default function PaginaCrachaParticipante() {
  redirect("/participante/credenciamento");
}
