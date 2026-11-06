import { obterUsuarioAtual } from "@/lib/auth";
import InscricaoEdicaoPainel from "@/components/interno/InscricaoEdicaoPainel";

// ?inscrever=1 (botão "Inscrever-se" do Início e /inscricao) abre direto o
// passo a passo para quem ainda não está inscrito.
export default async function PaginaInscricaoEdicao({ params, searchParams }) {
  const usuario = await obterUsuarioAtual();

  return (
    <InscricaoEdicaoPainel
      edicaoId={params.edicaoId}
      usuario={usuario}
      abrirInscricao={searchParams?.inscrever === "1"}
    />
  );
}
