import { redirect } from "next/navigation";
import { listarEdicoes } from "@/lib/edicoes";

export default async function PaginaAdmin() {
  const edicoes = await listarEdicoes();

  if (edicoes.length > 0) {
    redirect(`/admin/edicoes/${edicoes[0].id}`);
  }

  redirect("/admin/comecar");
}
