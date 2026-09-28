import AvaliacaoParticipante from "@/components/interno/AvaliacaoParticipante";

export default function PaginaAvaliacaoParticipante({ params }) {
  return <AvaliacaoParticipante atribuicaoId={params.atribuicaoId} />;
}
