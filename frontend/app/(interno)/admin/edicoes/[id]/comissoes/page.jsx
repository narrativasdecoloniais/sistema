import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarComissoes } from "@/lib/comissoes";
import { listarTiposComissao } from "@/lib/tiposComissao";
import ComissoesPainel from "@/components/interno/ComissoesPainel";

export default async function PaginaComissoes({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "COMISSOES")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const [comissoes, tiposComissao] = await Promise.all([
    listarComissoes(params.id),
    listarTiposComissao(),
  ]);

  return (
    <ComissoesPainel
      edicaoId={params.id}
      comissoesIniciais={comissoes}
      tiposComissao={tiposComissao}
    />
  );
}
