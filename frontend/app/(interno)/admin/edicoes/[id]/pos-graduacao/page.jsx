import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPapel, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarProgramasPosGraduacao } from "@/lib/programasPosGraduacao";
import ProgramasPosGraduacaoPainel from "@/components/interno/ProgramasPosGraduacaoPainel";

export default async function PaginaProgramasPosGraduacao({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "PROGRAMAS_POS_GRADUACAO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const programas = await listarProgramasPosGraduacao();

  return <ProgramasPosGraduacaoPainel programasIniciais={programas} podeEditar={temPapel(usuario, "ADMIN")} />;
}
