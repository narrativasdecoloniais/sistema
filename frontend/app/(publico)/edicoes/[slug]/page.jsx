import { notFound } from "next/navigation";
import DefinirEdicaoExibida from "@/components/publico/DefinirEdicaoExibida";
import {
  buscarEdicaoAtual,
  buscarEdicaoPorSlug,
  listarAtividadesPorEdicaoSlug,
  listarModalidadesSubmissaoPublicas,
  listarComissoesPublicas,
  listarProgramasPosGraduacaoPublico,
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
  // Modalidades/Comissões só existem pra "edição atual" hoje (ver
  // /publico/edicao-atual/modalidades-submissao e /comissoes) — pra uma
  // edição passada, fica vazio mesmo (nada pra buscar). Programas de
  // pós-graduação já são um catálogo global (não vinculado a edição), por
  // isso busca sempre, igual o Footer fazia antes de a listagem migrar
  // pra dentro desta dobra.
  const [atividades, modalidades, comissoes, programasPosGraduacao] = await Promise.all([
    listarAtividadesPorEdicaoSlug(params.slug),
    ehEdicaoAtual ? listarModalidadesSubmissaoPublicas() : Promise.resolve([]),
    ehEdicaoAtual ? listarComissoesPublicas() : Promise.resolve([]),
    listarProgramasPosGraduacaoPublico(),
  ]);

  return (
    <>
      <DefinirEdicaoExibida numero={edicao.numero} navegacao={montarPropsNavegacao(edicao)} />
      <PaginaInicialConteudo
        {...montarPropsPaginaEdicao(edicao, atividades, ehEdicaoAtual)}
        modalidades={modalidades}
        comissoes={comissoes}
        programasPosGraduacao={programasPosGraduacao}
      />
    </>
  );
}
