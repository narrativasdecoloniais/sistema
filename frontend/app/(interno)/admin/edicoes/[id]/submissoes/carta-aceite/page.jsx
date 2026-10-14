import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { buscarCartasAceite } from "@/lib/certificadosAdmin";
import CartasAceitePainel from "@/components/interno/CartasAceitePainel";

// Mesma permissão do Resultado (backend: cartasAceite.routes.js).
export default async function PaginaCartaAceite({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "SUBMISSOES_RESULTADO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const dados = await buscarCartasAceite(params.id);

  return <CartasAceitePainel edicaoId={params.id} dadosIniciais={dados} />;
}
