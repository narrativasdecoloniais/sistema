import { notFound } from "next/navigation";
import DetalheAtividade from "@/components/publico/DetalheAtividade";
import { buscarAtividadePublicaPorSlug } from "@/lib/publico";

export async function generateMetadata({ params }) {
  const atividade = await buscarAtividadePublicaPorSlug(params.slug);
  return {
    title: atividade ? `${atividade.nome} — Narrativas` : "Atividade não encontrada",
  };
}

export default async function PaginaAtividade({ params }) {
  const atividade = await buscarAtividadePublicaPorSlug(params.slug);
  if (!atividade) notFound();

  return <DetalheAtividade atividade={atividade} permiteInscricao />;
}
