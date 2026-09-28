import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { buscarResumoResultado, listarTrabalhosResultado, listarModelosEmailResultado } from "@/lib/resultadoAdmin";
import { listarModalidadesSubmissao } from "@/lib/modalidadesSubmissao";
import ResultadoSubmissoesPainel from "@/components/interno/ResultadoSubmissoesPainel";

export default async function PaginaSubmissoesResultado({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "SUBMISSOES_RESULTADO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const [resumo, trabalhos, { modelos, marcadores }, modalidades] = await Promise.all([
    buscarResumoResultado(params.id),
    listarTrabalhosResultado(params.id),
    listarModelosEmailResultado(params.id),
    listarModalidadesSubmissao(params.id),
  ]);

  return (
    <ResultadoSubmissoesPainel
      edicaoId={params.id}
      resumoInicial={resumo}
      trabalhosIniciais={trabalhos}
      modelosIniciais={modelos}
      marcadores={marcadores}
      modalidades={modalidades}
    />
  );
}
