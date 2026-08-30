import {
  buscarEdicaoAtual,
  listarAtividadesPublicas,
  listarModalidadesSubmissaoPublicas,
  listarComissoesPublicas,
  montarPropsPaginaEdicao,
} from "@/lib/publico";
import PaginaInicialConteudo from "./PaginaInicialConteudo";

export default async function PaginaInicial() {
  const [edicaoAtual, atividades, modalidades, comissoes] = await Promise.all([
    buscarEdicaoAtual(),
    listarAtividadesPublicas(),
    listarModalidadesSubmissaoPublicas(),
    listarComissoesPublicas(),
  ]);

  return (
    <PaginaInicialConteudo
      {...montarPropsPaginaEdicao(edicaoAtual, atividades, true)}
      modalidades={modalidades}
      comissoes={comissoes}
    />
  );
}
