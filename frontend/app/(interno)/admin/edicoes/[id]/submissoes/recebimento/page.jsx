import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarSubmissoes } from "@/lib/submissoesAdmin";
import { listarModalidadesSubmissao } from "@/lib/modalidadesSubmissao";
import SubmissoesRecebimentoPainel from "@/components/interno/SubmissoesRecebimentoPainel";

export default async function PaginaSubmissoesRecebimento({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "SUBMISSOES_RECEBIMENTO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const [submissoes, modalidades] = await Promise.all([
    listarSubmissoes(params.id),
    listarModalidadesSubmissao(params.id),
  ]);

  return (
    <SubmissoesRecebimentoPainel
      edicaoId={params.id}
      submissoesIniciais={submissoes}
      modalidadesIniciais={modalidades}
    />
  );
}
