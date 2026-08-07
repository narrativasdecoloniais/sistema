import { redirect } from "next/navigation";
import { obterUsuarioAtual, temPapel } from "@/lib/auth";

export default async function LayoutAdmin({ children }) {
  const usuario = await obterUsuarioAtual();

  if (!temPapel(usuario, "ADMIN", "ORGANIZADOR")) {
    redirect("/participante");
  }

  return children;
}
