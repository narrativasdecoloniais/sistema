import { Image as IconeImagem } from "lucide-react";
import Logo from "@/components/publico/Logo";
import CampoLogoSvg from "./CampoLogoSvg";
import CampoCoresLogo from "./CampoCoresLogo";
import CampoFaixaHero from "./CampoFaixaHero";
import CampoFundoHero from "./CampoFundoHero";
import CampoCheckbox from "./CampoCheckbox";
import CampoCorSecao, { OPCOES_COR_SECAO, OPCOES_COR_PUBLICA } from "./CampoCorSecao";
import CabecalhoSecao from "./CabecalhoSecao";
import { contraste, misturar } from "@/lib/contraste";
import { resolverCorHex } from "@/lib/cores";
import styles from "./EdicaoForm.module.scss";

const LIMIAR_CONTRASTE_TEXTO = 4.5;
const LIMIAR_CONTRASTE_BUZIO = 3;

function estiloFaixa(tipo, hexCor, imagem) {
  if (tipo === "NENHUMA") {
    return { display: "none" };
  }
  if (tipo === "IMAGEM") {
    return imagem
      ? { backgroundImage: `url(${imagem})`, backgroundRepeat: "repeat-y", backgroundSize: "100% auto" }
      : { background: "var(--borda)" };
  }
  return { background: hexCor };
}

function estiloFundo(tipo, hexEfetivo, imagem) {
  if (tipo === "IMAGEM") {
    return imagem
      ? { backgroundImage: `url(${imagem})`, backgroundSize: "cover", backgroundPosition: "center" }
      : { background: "var(--borda)" };
  }
  return { background: hexEfetivo };
}

export default function SecaoHero({
  logoSvg,
  logoSvgViewBox,
  logoSvgCores,
  corFundoHero,
  opacidadeFundoHero,
  fundoHeroTipo,
  imagemFundoHeroDesktop,
  imagemFundoHeroMobile,
  corTextoHero,
  corBuzioHero,
  faixaHeroTipoDesktop,
  corFaixaHeroDesktop,
  imagemFaixaHeroDesktop,
  larguraFaixaHeroDesktop,
  faixaHeroTipoMobile,
  corFaixaHeroMobile,
  imagemFaixaHeroMobile,
  larguraFaixaHeroMobile,
  mostrarFaixaHero,
  erro,
  aoMudarLogo,
  aoMudarLogoCores,
  aoMudarCorFundoHero,
  aoMudarOpacidadeFundoHero,
  aoMudarFundoHeroTipo,
  aoMudarImagemFundoHeroDesktop,
  aoMudarImagemFundoHeroMobile,
  aoMudarCorTextoHero,
  aoMudarCorBuzioHero,
  aoMudarFaixaHeroTipoDesktop,
  aoMudarCorFaixaHeroDesktop,
  aoMudarImagemFaixaHeroDesktop,
  aoMudarLarguraFaixaHeroDesktop,
  aoMudarFaixaHeroTipoMobile,
  aoMudarCorFaixaHeroMobile,
  aoMudarImagemFaixaHeroMobile,
  aoMudarLarguraFaixaHeroMobile,
  aoMudarMostrarFaixaHero,
}) {
  const hexFundo = resolverCorHex(corFundoHero, OPCOES_COR_SECAO);
  const hexPapel = resolverCorHex("PAPEL", OPCOES_COR_SECAO);
  const hexTexto = resolverCorHex(corTextoHero, OPCOES_COR_PUBLICA);
  const hexBuzio = resolverCorHex(corBuzioHero, OPCOES_COR_PUBLICA);
  const hexFaixaDesktop = resolverCorHex(corFaixaHeroDesktop, OPCOES_COR_PUBLICA);
  const hexFaixaMobile = resolverCorHex(corFaixaHeroMobile, OPCOES_COR_PUBLICA);

  // Cor de fundo "de verdade" depois de misturar com --papel na opacidade
  // escolhida (ver .hero em page.module.scss, que faz o mesmo via CSS
  // color-mix()) — o aviso de contraste usa essa cor efetiva, não a cor
  // escolhida pura, já que um fundo bem transparente deixa o papel aparecer.
  const hexFundoEfetivo =
    hexFundo && hexPapel ? misturar(hexFundo, opacidadeFundoHero ?? 100, hexPapel) : hexFundo;

  // Com fundo em imagem não dá pra calcular contraste contra uma cor fixa —
  // o aviso só faz sentido no modo cor sólida.
  const usaImagemNoFundo = fundoHeroTipo === "IMAGEM";
  const contrasteTexto =
    !usaImagemNoFundo && hexFundoEfetivo && hexTexto ? contraste(hexFundoEfetivo, hexTexto) : null;
  const contrasteBuzio =
    !usaImagemNoFundo && hexFundoEfetivo && hexBuzio ? contraste(hexFundoEfetivo, hexBuzio) : null;

  return (
    <div className={styles.secao}>
      <CabecalhoSecao
        Icone={IconeImagem}
        titulo="Hero"
        descricao="Logo, fundo e cores da abertura da página pública desta edição."
      />
      <div className={styles.camposSecao}>
        {logoSvg && (
          <div className={styles.previewLogoHero}>
            <Logo
              logoSvg={logoSvg}
              logoSvgViewBox={logoSvgViewBox}
              logoSvgCores={logoSvgCores}
              tamanho="pequena"
              animado={false}
            />
          </div>
        )}
        <CampoLogoSvg
          id="logoSvgHero"
          rotulo="Logo customizada"
          temLogoAtual={Boolean(logoSvg)}
          onChange={aoMudarLogo}
          erro={erro}
        />
        <CampoCoresLogo cores={logoSvgCores} onChange={aoMudarLogoCores} />

        <CampoFundoHero
          tipo={fundoHeroTipo}
          cor={corFundoHero}
          opacidade={opacidadeFundoHero}
          imagemDesktop={imagemFundoHeroDesktop}
          imagemMobile={imagemFundoHeroMobile}
          aoMudarTipo={aoMudarFundoHeroTipo}
          aoMudarCor={aoMudarCorFundoHero}
          aoMudarOpacidade={aoMudarOpacidadeFundoHero}
          aoMudarImagemDesktop={aoMudarImagemFundoHeroDesktop}
          aoMudarImagemMobile={aoMudarImagemFundoHeroMobile}
        />
        <CampoCorSecao
          id="corTextoHero"
          rotulo="Cor do texto"
          valor={corTextoHero}
          opcoes={OPCOES_COR_PUBLICA}
          onChange={aoMudarCorTextoHero}
        />
        <CampoCorSecao
          id="corBuzioHero"
          rotulo="Cor do búzio"
          valor={corBuzioHero}
          opcoes={OPCOES_COR_PUBLICA}
          onChange={aoMudarCorBuzioHero}
        />

        <CampoFaixaHero
          id="faixaHeroDesktop"
          titulo="Faixas laterais — Desktop"
          tipo={faixaHeroTipoDesktop}
          cor={corFaixaHeroDesktop}
          imagem={imagemFaixaHeroDesktop}
          largura={larguraFaixaHeroDesktop}
          aoMudarTipo={aoMudarFaixaHeroTipoDesktop}
          aoMudarCor={aoMudarCorFaixaHeroDesktop}
          aoMudarImagem={aoMudarImagemFaixaHeroDesktop}
          aoMudarLargura={aoMudarLarguraFaixaHeroDesktop}
        />
        <CampoFaixaHero
          id="faixaHeroMobile"
          titulo="Faixas laterais — Mobile"
          tipo={faixaHeroTipoMobile}
          cor={corFaixaHeroMobile}
          imagem={imagemFaixaHeroMobile}
          largura={larguraFaixaHeroMobile}
          aoMudarTipo={aoMudarFaixaHeroTipoMobile}
          aoMudarCor={aoMudarCorFaixaHeroMobile}
          aoMudarImagem={aoMudarImagemFaixaHeroMobile}
          aoMudarLargura={aoMudarLarguraFaixaHeroMobile}
        />
        <CampoCheckbox
          id="mostrarFaixaHero"
          rotulo="Mostrar a faixa lateral nesta seção"
          checked={mostrarFaixaHero}
          onChange={aoMudarMostrarFaixaHero}
        />

        <div className={styles.linhaPreviewHero}>
          <div className={styles.blocoPreviewHero}>
            <span className={styles.rotuloPreviewHero}>Desktop</span>
            <div
              className={styles.previewHero}
              style={estiloFundo(fundoHeroTipo, hexFundoEfetivo, imagemFundoHeroDesktop)}
            >
              <span
                className={styles.previewHeroFaixa}
                style={estiloFaixa(faixaHeroTipoDesktop, hexFaixaDesktop, imagemFaixaHeroDesktop)}
                aria-hidden="true"
              />
              <div className={styles.previewHeroConteudo}>
                <span className={styles.previewHeroBuzio} style={{ background: hexBuzio }} aria-hidden="true" />
                <span className={styles.previewHeroTexto} style={{ color: hexTexto }}>Aa</span>
              </div>
              <span
                className={styles.previewHeroFaixa}
                style={estiloFaixa(faixaHeroTipoDesktop, hexFaixaDesktop, imagemFaixaHeroDesktop)}
                aria-hidden="true"
              />
            </div>
          </div>
          <div className={styles.blocoPreviewHero}>
            <span className={styles.rotuloPreviewHero}>Mobile</span>
            <div
              className={`${styles.previewHero} ${styles.previewHeroEstreito}`}
              style={estiloFundo(fundoHeroTipo, hexFundoEfetivo, imagemFundoHeroMobile)}
            >
              <span
                className={styles.previewHeroFaixa}
                style={estiloFaixa(faixaHeroTipoMobile, hexFaixaMobile, imagemFaixaHeroMobile)}
                aria-hidden="true"
              />
              <div className={styles.previewHeroConteudo}>
                <span className={styles.previewHeroBuzio} style={{ background: hexBuzio }} aria-hidden="true" />
                <span className={styles.previewHeroTexto} style={{ color: hexTexto }}>Aa</span>
              </div>
              <span
                className={styles.previewHeroFaixa}
                style={estiloFaixa(faixaHeroTipoMobile, hexFaixaMobile, imagemFaixaHeroMobile)}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {contrasteTexto !== null && contrasteTexto < LIMIAR_CONTRASTE_TEXTO && (
          <p className={styles.avisoContraste}>
            Contraste baixo entre fundo e texto ({contrasteTexto.toFixed(1)}:1 — mínimo recomendado {LIMIAR_CONTRASTE_TEXTO}:1). Pode ficar difícil de ler.
          </p>
        )}
        {contrasteBuzio !== null && contrasteBuzio < LIMIAR_CONTRASTE_BUZIO && (
          <p className={styles.avisoContraste}>
            Contraste baixo entre fundo e búzio ({contrasteBuzio.toFixed(1)}:1 — mínimo recomendado {LIMIAR_CONTRASTE_BUZIO}:1). O ícone pode ficar difícil de ver.
          </p>
        )}
      </div>
    </div>
  );
}
