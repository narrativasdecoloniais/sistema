import { redirect } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/auth";
import { secoesDeMonitor, temPapel } from "@/lib/permissoes";

// Monitor selecionado só entra no painel da edição em que tem seções
// liberadas (o backend também confere por edição em cada rota).
export default async function LayoutEdicaoAdmin({ children, params }) {
  const usuario = await obterUsuarioAtual();

  if (!temPapel(usuario, "ADMIN", "ORGANIZADOR") && secoesDeMonitor(usuario, params.id).length === 0) {
    redirect("/participante");
  }

  return children;
}
