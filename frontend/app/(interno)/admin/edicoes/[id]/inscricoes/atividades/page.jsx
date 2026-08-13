import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarInscricoesAtividade } from "@/lib/inscricoesAdmin";
import { listarAtividades } from "@/lib/atividades";
import InscricoesAtividadePainel from "@/components/interno/InscricoesAtividadePainel";

export default async function PaginaInscricoesAtividade({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "INSCRICOES_ATIVIDADES")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const [inscricoes, atividades] = await Promise.all([
    listarInscricoesAtividade(params.id),
    listarAtividades(params.id),
  ]);

  return (
    <InscricoesAtividadePainel
      edicaoId={params.id}
      inscricoesIniciais={inscricoes}
      atividades={atividades}
    />
  );
}
