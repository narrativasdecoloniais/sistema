import PreviaArtigoAnais from "@/components/publico/anais/PreviaArtigoAnais";

// Fica no grupo (publico) para ter a pele do site, mas sob /participante —
// o middleware já exige sessão.
export const metadata = {
  title: "Prévia do trabalho",
  robots: { index: false, follow: false },
};

export default function PaginaPreviaSubmissao({ params }) {
  return <PreviaArtigoAnais submissaoId={params.id} />;
}
