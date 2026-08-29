import styles from "./FaixaLateral.module.scss";

// Par de faixas laterais (esquerda/direita) decorativas — cor/imagem/largura
// vêm sempre da Hero da edição (ver SecaoHero.jsx no admin) via os props
// abaixo. Copiado de frontend/app/(publico)/PaginaInicialConteudo.jsx (mesmo
// componente usado pela home) — duplicado de propósito em vez de importado
// de lá, pra nenhuma mudança aqui arriscar regressão na home. Componente
// puro (sem hooks/estado), por isso não precisa de "use client".
export default function FaixaLateral({
  estilo,
  corDesktop,
  corMobile,
  tipoDesktop,
  tipoMobile,
}) {
  return (
    <>
      <span
        className={`${styles.faixaLateral} ${styles.faixaLateralEsquerda}`}
        data-cor-faixa-desktop={corDesktop}
        data-cor-faixa-mobile={corMobile}
        data-faixa-tipo-desktop={tipoDesktop}
        data-faixa-tipo-mobile={tipoMobile}
        style={estilo}
        aria-hidden="true"
      />
      <span
        className={`${styles.faixaLateral} ${styles.faixaLateralDireita}`}
        data-cor-faixa-desktop={corDesktop}
        data-cor-faixa-mobile={corMobile}
        data-faixa-tipo-desktop={tipoDesktop}
        data-faixa-tipo-mobile={tipoMobile}
        style={estilo}
        aria-hidden="true"
      />
    </>
  );
}
