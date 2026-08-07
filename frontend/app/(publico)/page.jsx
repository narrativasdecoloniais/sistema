import {
  buscarEdicaoAtual,
  listarAtividadesPublicas,
  formatarPeriodoEdicao,
  formatarLocalEdicao,
  formatarRealizacao,
} from "@/lib/publico";
import PaginaInicialConteudo from "./PaginaInicialConteudo";

export default async function PaginaInicial() {
  const [edicaoAtual, atividades] = await Promise.all([
    buscarEdicaoAtual(),
    listarAtividadesPublicas(),
  ]);

  const realizadores = edicaoAtual?.realizadores || [];

  return (
    <PaginaInicialConteudo
      atividades={atividades}
      realizadores={realizadores}
      corFundoRealizadores={edicaoAtual?.corFundoRealizadores || "BARRO"}
      logoSvg={edicaoAtual?.logoSvg}
      logoSvgViewBox={edicaoAtual?.logoSvgViewBox}
      logoSvgCores={edicaoAtual?.logoSvgCores}
      corFundoHero={edicaoAtual?.corFundoHero || "PAPEL"}
      opacidadeFundoHero={edicaoAtual?.opacidadeFundoHero ?? 100}
      fundoHeroTipo={edicaoAtual?.fundoHeroTipo || "COR"}
      imagemFundoHeroDesktop={edicaoAtual?.imagemFundoHeroDesktop}
      imagemFundoHeroMobile={edicaoAtual?.imagemFundoHeroMobile}
      corTextoHero={edicaoAtual?.corTextoHero || "TINTA"}
      corBuzioHero={edicaoAtual?.corBuzioHero || "BUZIO"}
      faixaHeroTipoDesktop={edicaoAtual?.faixaHeroTipoDesktop || "COR"}
      corFaixaHeroDesktop={edicaoAtual?.corFaixaHeroDesktop || "OCRE"}
      imagemFaixaHeroDesktop={edicaoAtual?.imagemFaixaHeroDesktop}
      faixaHeroTipoMobile={edicaoAtual?.faixaHeroTipoMobile || "COR"}
      corFaixaHeroMobile={edicaoAtual?.corFaixaHeroMobile || "OCRE"}
      imagemFaixaHeroMobile={edicaoAtual?.imagemFaixaHeroMobile}
      temEdicaoAtual={Boolean(edicaoAtual)}
      dataEvento={formatarPeriodoEdicao(edicaoAtual?.dataInicio, edicaoAtual?.dataFim)}
      localEvento={formatarLocalEdicao(edicaoAtual)}
      realizacaoEvento={formatarRealizacao(realizadores)}
    />
  );
}
