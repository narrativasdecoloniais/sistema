import CorrecaoSubmissaoForm from "@/components/interno/CorrecaoSubmissaoForm";

export default function PaginaCorrecaoSubmissao({ params }) {
  return <CorrecaoSubmissaoForm submissaoId={params.id} />;
}
