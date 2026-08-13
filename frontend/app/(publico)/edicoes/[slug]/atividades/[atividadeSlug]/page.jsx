import { notFound } from "next/navigation";
import DetalheAtividade from "@/components/publico/DetalheAtividade";
import DefinirEdicaoExibida from "@/components/publico/DefinirEdicaoExibida";
import { buscarAtividadeDaEdicao, buscarEdicaoAtual, buscarEdicaoPorSlug } from "@/lib/publico";

export async function generateMetadata({ params }) {
  const atividade = await buscarAtividadeDaEdicao(params.slug, params.atividadeSlug);
  return {
    title: atividade ? `${atividade.nome} — Narrativas` : "Atividade não encontrada",
  };
}

export default async function PaginaAtividadeDaEdicao({ params }) {
  const [atividade, edicao, edicaoAtual] = await Promise.all([
    buscarAtividadeDaEdicao(params.slug, params.atividadeSlug),
    buscarEdicaoPorSlug(params.slug),
    buscarEdicaoAtual(),
  ]);
  if (!atividade) notFound();

  return (
    <>
      <DefinirEdicaoExibida numero={edicao?.numero} />
      <DetalheAtividade atividade={atividade} permiteInscricao={atividade.edicaoId === edicaoAtual?.id} />
    </>
  );
}
