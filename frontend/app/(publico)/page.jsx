import {
  buscarEdicaoAtual,
  listarAtividadesPublicas,
  montarPropsPaginaEdicao,
} from "@/lib/publico";
import PaginaInicialConteudo from "./PaginaInicialConteudo";

export default async function PaginaInicial() {
  const [edicaoAtual, atividades] = await Promise.all([
    buscarEdicaoAtual(),
    listarAtividadesPublicas(),
  ]);

  return (
    <PaginaInicialConteudo {...montarPropsPaginaEdicao(edicaoAtual, atividades, true)} />
  );
}
