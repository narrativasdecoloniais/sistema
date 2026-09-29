import { redirect } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/auth";
import { buscarEdicaoAtual } from "@/lib/publico";

// A inscrição só acontece logada, na área do participante — o fluxo público
// (CPF + e-mail, sem senha) foi removido porque não comprovava a posse do
// e-mail. Esta rota continua existindo como porta de entrada estável (botão
// "Inscreva-se" e links antigos já compartilhados): leva direto à inscrição
// da edição atual, passando pelo login quando preciso.
export default async function PaginaInscricao() {
  const [usuario, edicao] = await Promise.all([obterUsuarioAtual(), buscarEdicaoAtual()]);
  const destino = edicao ? `/participante/inscricoes/${edicao.id}` : "/participante/inscricoes";

  redirect(usuario ? destino : `/login?destino=${encodeURIComponent(destino)}`);
}
