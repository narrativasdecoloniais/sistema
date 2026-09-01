import { obterUsuarioAtual } from "@/lib/auth";
import InscricaoEdicaoPainel from "@/components/interno/InscricaoEdicaoPainel";

export default async function PaginaInscricaoEdicao({ params }) {
  const usuario = await obterUsuarioAtual();

  return <InscricaoEdicaoPainel edicaoId={params.edicaoId} usuario={usuario} />;
}
