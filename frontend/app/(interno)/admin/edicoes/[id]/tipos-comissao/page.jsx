import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPapel, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarTiposComissao } from "@/lib/tiposComissao";
import TiposComissaoPainel from "@/components/interno/TiposComissaoPainel";

export default async function PaginaTiposComissao({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "TIPOS_COMISSAO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const tipos = await listarTiposComissao();

  return <TiposComissaoPainel tiposIniciais={tipos} podeEditar={temPapel(usuario, "ADMIN")} />;
}
