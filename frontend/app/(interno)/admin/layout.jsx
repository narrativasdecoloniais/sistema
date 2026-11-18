import { redirect } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/auth";
import { temAcessoAoPainel } from "@/lib/permissoes";

export default async function LayoutAdmin({ children }) {
  const usuario = await obterUsuarioAtual();

  if (!temAcessoAoPainel(usuario)) {
    redirect("/participante");
  }

  return children;
}
