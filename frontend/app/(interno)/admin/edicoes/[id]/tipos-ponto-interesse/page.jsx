import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPapel, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarTiposPontoInteresse } from "@/lib/tiposPontoInteresse";
import TiposPontoInteressePainel from "@/components/interno/TiposPontoInteressePainel";

export default async function PaginaTiposPontoInteresse({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "TIPOS_PONTO_INTERESSE")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const tipos = await listarTiposPontoInteresse();

  return <TiposPontoInteressePainel tiposIniciais={tipos} podeEditar={temPapel(usuario, "ADMIN")} />;
}
