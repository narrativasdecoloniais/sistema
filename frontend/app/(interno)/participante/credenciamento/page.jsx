import CredenciamentoParticipantePainel from "@/components/interno/CredenciamentoParticipantePainel";

export default function PaginaCredenciamentoParticipante({ searchParams }) {
  return <CredenciamentoParticipantePainel abaInicial={searchParams?.aba} />;
}
