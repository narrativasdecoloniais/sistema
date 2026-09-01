import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarModalidadesSubmissao } from "@/lib/modalidadesSubmissao";
import { listarAtividades } from "@/lib/atividades";
import ModalidadesSubmissaoPainel from "@/components/interno/ModalidadesSubmissaoPainel";

export default async function PaginaModalidadesSubmissao({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "SUBMISSOES_MODALIDADES")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const [modalidades, atividades] = await Promise.all([
    listarModalidadesSubmissao(params.id),
    listarAtividades(params.id),
  ]);

  return (
    <ModalidadesSubmissaoPainel
      edicaoId={params.id}
      modalidadesIniciais={modalidades}
      atividadesDisponiveis={atividades}
    />
  );
}
