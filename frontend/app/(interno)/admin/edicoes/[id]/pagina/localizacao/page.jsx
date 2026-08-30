import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarTiposPontoInteresse } from "@/lib/tiposPontoInteresse";
import LocalizacaoForm from "@/components/interno/LocalizacaoForm";

export default async function PaginaLocalizacao({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "PAGINA_LOCALIZACAO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const tiposPontoInteresse = await listarTiposPontoInteresse();

  return <LocalizacaoForm edicaoInicial={edicao} tiposPontoInteresse={tiposPontoInteresse} />;
}
