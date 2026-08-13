import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPapel, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarTiposAtividade } from "@/lib/tiposAtividade";
import TiposAtividadePainel from "@/components/interno/TiposAtividadePainel";

export default async function PaginaTiposAtividade({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "TIPOS_ATIVIDADE")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const tipos = await listarTiposAtividade();

  return <TiposAtividadePainel tiposIniciais={tipos} podeEditar={temPapel(usuario, "ADMIN")} />;
}
