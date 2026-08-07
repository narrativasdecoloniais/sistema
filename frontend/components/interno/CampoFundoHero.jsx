import CampoLogo from "./CampoLogo";
import CampoCorSecao from "./CampoCorSecao";
import CampoOpacidade from "./CampoOpacidade";
import CampoRadioSecao from "./CampoRadioSecao";
import stylesCampo from "./CampoPrime.module.scss";
import styles from "./EdicaoForm.module.scss";

const OPCOES_TIPO_FUNDO = [
  { valor: "COR", rotulo: "Cor sólida" },
  { valor: "IMAGEM", rotulo: "Imagem" },
];

// Fundo full-bleed — bem maior que uma logo/textura, por isso os limites
// próprios (ver CampoLogo.jsx, que ganhou dimensaoMax/tamanhoMaxArquivo
// justamente pra isso). Um arquivo por breakpoint: a Hero muda muito de
// proporção entre desktop (larga, baixa) e mobile (estreita, alta), então
// uma imagem só ficaria mal cortada num dos dois com background-size:cover.
const TAMANHO_MAX_IMAGEM_FUNDO = 10 * 1024 * 1024;

export default function CampoFundoHero({
  tipo,
  cor,
  opacidade,
  imagemDesktop,
  imagemMobile,
  aoMudarTipo,
  aoMudarCor,
  aoMudarOpacidade,
  aoMudarImagemDesktop,
  aoMudarImagemMobile,
}) {
  const usaImagem = tipo === "IMAGEM";

  return (
    <div className={styles.blocoFaixaHero}>
      <span className={stylesCampo.rotulo}>Fundo</span>
      <CampoRadioSecao id="fundoHeroTipo" valor={tipo} opcoes={OPCOES_TIPO_FUNDO} onChange={aoMudarTipo} />

      {usaImagem ? (
        <>
          <CampoLogo
            id="imagemFundoHeroDesktop"
            rotulo="Imagem de fundo — Desktop"
            valor={imagemDesktop}
            onChange={aoMudarImagemDesktop}
            dimensaoMax={2560}
            tamanhoMaxArquivo={TAMANHO_MAX_IMAGEM_FUNDO}
            textoItem="imagem"
          />
          <p className={styles.avisoContraste}>
            Recomendado: 1920×1080px no mínimo (paisagem, 16:9) — pode ir até 2560×1440 pra mais nitidez em
            monitores grandes. A imagem cobre a tela inteira sem distorcer (recorta as bordas se precisar).
          </p>
          <CampoLogo
            id="imagemFundoHeroMobile"
            rotulo="Imagem de fundo — Mobile"
            valor={imagemMobile}
            onChange={aoMudarImagemMobile}
            dimensaoMax={1920}
            tamanhoMaxArquivo={TAMANHO_MAX_IMAGEM_FUNDO}
            textoItem="imagem"
          />
          <p className={styles.avisoContraste}>
            Recomendado: 1080×1920px no mínimo (retrato, 9:16).
          </p>
        </>
      ) : (
        <>
          <CampoCorSecao id="corFundoHero" rotulo="Cor de fundo" valor={cor} onChange={aoMudarCor} />
          <CampoOpacidade
            id="opacidadeFundoHero"
            rotulo="Opacidade do fundo"
            valor={opacidade}
            onChange={aoMudarOpacidade}
          />
        </>
      )}
    </div>
  );
}
