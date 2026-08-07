import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPapel } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarOrganizadores } from "@/lib/organizadores";
import OrganizadoresPainel from "@/components/interno/OrganizadoresPainel";

export default async function PaginaOrganizadores({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPapel(usuario, "ADMIN")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const organizadores = await listarOrganizadores();

  return <OrganizadoresPainel organizadoresIniciais={organizadores} />;
}
