import { notFound } from "next/navigation";
import DefinirEdicaoExibida from "@/components/publico/DefinirEdicaoExibida";
import {
  buscarEdicaoAtual,
  buscarEdicaoPorSlug,
  listarAtividadesPorEdicaoSlug,
  listarModalidadesSubmissaoPublicas,
  montarPropsPaginaEdicao,
  montarPropsNavegacao,
} from "@/lib/publico";
import PaginaInicialConteudo from "../../PaginaInicialConteudo";

export default async function PaginaEdicao({ params }) {
  const [edicao, edicaoAtual] = await Promise.all([
    buscarEdicaoPorSlug(params.slug),
    buscarEdicaoAtual(),
  ]);
  if (!edicao) notFound();

  const ehEdicaoAtual = edicao.id === edicaoAtual?.id;
  // Modalidades de submissão só existem pra "edição atual" hoje (ver
  // /publico/edicao-atual/modalidades-submissao) — pra uma edição passada,
  // fica vazio mesmo (nada pra buscar).
  const [atividades, modalidades] = await Promise.all([
    listarAtividadesPorEdicaoSlug(params.slug),
    ehEdicaoAtual ? listarModalidadesSubmissaoPublicas() : Promise.resolve([]),
  ]);

  return (
    <>
      <DefinirEdicaoExibida numero={edicao.numero} navegacao={montarPropsNavegacao(edicao)} />
      <PaginaInicialConteudo
        {...montarPropsPaginaEdicao(edicao, atividades, ehEdicaoAtual)}
        modalidades={modalidades}
      />
    </>
  );
}
