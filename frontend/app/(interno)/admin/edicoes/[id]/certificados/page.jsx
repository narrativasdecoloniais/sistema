import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { buscarCertificados } from "@/lib/certificadosAdmin";
import CertificadosPainel from "@/components/interno/CertificadosPainel";

export default async function PaginaCertificados({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "CERTIFICADOS")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const dados = await buscarCertificados(params.id);

  return <CertificadosPainel edicaoId={params.id} dadosIniciais={dados} />;
}
