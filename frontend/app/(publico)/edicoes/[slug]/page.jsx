import { notFound } from "next/navigation";
import DefinirEdicaoExibida from "@/components/publico/DefinirEdicaoExibida";
import {
  buscarEdicaoAtual,
  buscarEdicaoPorSlug,
  listarAtividadesPorEdicaoSlug,
  montarPropsPaginaEdicao,
} from "@/lib/publico";
import PaginaInicialConteudo from "../../PaginaInicialConteudo";

export default async function PaginaEdicao({ params }) {
  const [edicao, edicaoAtual] = await Promise.all([
    buscarEdicaoPorSlug(params.slug),
    buscarEdicaoAtual(),
  ]);
  if (!edicao) notFound();

  const atividades = await listarAtividadesPorEdicaoSlug(params.slug);
  const ehEdicaoAtual = edicao.id === edicaoAtual?.id;

  return (
    <>
      <DefinirEdicaoExibida numero={edicao.numero} />
      <PaginaInicialConteudo {...montarPropsPaginaEdicao(edicao, atividades, ehEdicaoAtual)} />
    </>
  );
}
