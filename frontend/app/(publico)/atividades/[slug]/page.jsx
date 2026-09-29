import { notFound } from "next/navigation";
import DetalheAtividade from "@/components/publico/DetalheAtividade";
import { buscarAtividadePublicaPorSlug, buscarEdicaoAtual } from "@/lib/publico";

export async function generateMetadata({ params }) {
  const atividade = await buscarAtividadePublicaPorSlug(params.slug);
  return {
    title: atividade ? `${atividade.nome} — Narrativas` : "Atividade não encontrada",
  };
}

export default async function PaginaAtividade({ params }) {
  const [atividade, edicaoAtual] = await Promise.all([
    buscarAtividadePublicaPorSlug(params.slug),
    buscarEdicaoAtual(),
  ]);
  if (!atividade) notFound();

  return <DetalheAtividade atividade={atividade} permiteInscricao={Boolean(edicaoAtual?.inscricoesAbertas)} />;
}
