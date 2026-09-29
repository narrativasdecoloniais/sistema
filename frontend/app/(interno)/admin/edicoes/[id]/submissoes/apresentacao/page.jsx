import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { buscarApresentacao } from "@/lib/apresentacaoAdmin";
import { listarModalidadesSubmissao } from "@/lib/modalidadesSubmissao";
import ApresentacaoSubmissoesPainel from "@/components/interno/ApresentacaoSubmissoesPainel";

export default async function PaginaSubmissoesApresentacao({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "SUBMISSOES_APRESENTACAO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const [dados, modalidades] = await Promise.all([
    buscarApresentacao(params.id),
    listarModalidadesSubmissao(params.id),
  ]);

  return <ApresentacaoSubmissoesPainel edicaoId={params.id} dadosIniciais={dados} modalidades={modalidades} />;
}
