import { notFound } from "next/navigation";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarInscricoesEdicao } from "@/lib/inscricoesAdmin";
import InscricoesEdicaoPainel from "@/components/interno/InscricoesEdicaoPainel";

export default async function PaginaInscricoesEdicao({ params }) {
  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const inscricoes = await listarInscricoesEdicao(params.id);

  return <InscricoesEdicaoPainel edicaoId={params.id} inscricoesIniciais={inscricoes} />;
}
