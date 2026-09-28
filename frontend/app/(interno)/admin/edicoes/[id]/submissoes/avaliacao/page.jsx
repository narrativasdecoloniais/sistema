import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarSubmissoesEmAvaliacao, listarAvaliadores, listarSugestoesTrocaArea } from "@/lib/avaliacoesAdmin";
import { listarModalidadesSubmissao } from "@/lib/modalidadesSubmissao";
import AvaliacaoSubmissoesPainel from "@/components/interno/AvaliacaoSubmissoesPainel";

export default async function PaginaSubmissoesAvaliacao({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "SUBMISSOES_AVALIACAO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const [submissoes, avaliadores, sugestoes, modalidades] = await Promise.all([
    listarSubmissoesEmAvaliacao(params.id),
    listarAvaliadores(params.id),
    listarSugestoesTrocaArea(params.id),
    listarModalidadesSubmissao(params.id),
  ]);

  return (
    <AvaliacaoSubmissoesPainel
      edicaoId={params.id}
      submissoesIniciais={submissoes}
      avaliadoresIniciais={avaliadores}
      sugestoesIniciais={sugestoes}
      modalidades={modalidades}
      resultadoDivulgadoEm={edicao.resultadoDivulgadoEm}
    />
  );
}
