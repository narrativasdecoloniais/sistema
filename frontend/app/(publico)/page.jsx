import {
  buscarEdicaoAtual,
  listarAtividadesPublicas,
  listarModalidadesSubmissaoPublicas,
  montarPropsPaginaEdicao,
} from "@/lib/publico";
import PaginaInicialConteudo from "./PaginaInicialConteudo";

export default async function PaginaInicial() {
  const [edicaoAtual, atividades, modalidades] = await Promise.all([
    buscarEdicaoAtual(),
    listarAtividadesPublicas(),
    listarModalidadesSubmissaoPublicas(),
  ]);

  return (
    <PaginaInicialConteudo
      {...montarPropsPaginaEdicao(edicaoAtual, atividades, true)}
      modalidades={modalidades}
    />
  );
}
