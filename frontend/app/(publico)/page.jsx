import {
  buscarEdicaoAtual,
  listarAtividadesPublicas,
  listarModalidadesSubmissaoPublicas,
  listarGruposConteudoPublicos,
  montarPropsPaginaEdicao,
} from "@/lib/publico";
import PaginaInicialConteudo from "./PaginaInicialConteudo";

export default async function PaginaInicial() {
  const [edicaoAtual, atividades, modalidades, grupos] = await Promise.all([
    buscarEdicaoAtual(),
    listarAtividadesPublicas(),
    listarModalidadesSubmissaoPublicas(),
    listarGruposConteudoPublicos(),
  ]);

  return (
    <PaginaInicialConteudo
      {...montarPropsPaginaEdicao(edicaoAtual, atividades, true)}
      modalidades={modalidades}
      grupos={grupos}
    />
  );
}
