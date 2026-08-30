import {
  buscarEdicaoAtual,
  listarAtividadesPublicas,
  listarModalidadesSubmissaoPublicas,
  listarComissoesPublicas,
  listarProgramasPosGraduacaoPublico,
  montarPropsPaginaEdicao,
} from "@/lib/publico";
import PaginaInicialConteudo from "./PaginaInicialConteudo";

export default async function PaginaInicial() {
  const [edicaoAtual, atividades, modalidades, comissoes, programasPosGraduacao] = await Promise.all([
    buscarEdicaoAtual(),
    listarAtividadesPublicas(),
    listarModalidadesSubmissaoPublicas(),
    listarComissoesPublicas(),
    listarProgramasPosGraduacaoPublico(),
  ]);

  return (
    <PaginaInicialConteudo
      {...montarPropsPaginaEdicao(edicaoAtual, atividades, true)}
      modalidades={modalidades}
      comissoes={comissoes}
      programasPosGraduacao={programasPosGraduacao}
    />
  );
}
