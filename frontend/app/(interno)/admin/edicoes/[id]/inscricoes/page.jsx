import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarInscricoesEdicao } from "@/lib/inscricoesAdmin";
import InscricoesEdicaoPainel from "@/components/interno/InscricoesEdicaoPainel";

export default async function PaginaInscricoesEdicao({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "INSCRICOES_GERAIS")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const inscricoes = await listarInscricoesEdicao(params.id);

  return <InscricoesEdicaoPainel edicaoId={params.id} inscricoesIniciais={inscricoes} />;
}
