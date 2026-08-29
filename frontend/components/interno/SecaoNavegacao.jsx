import { Navigation } from "lucide-react";
import CampoFundoNav from "./CampoFundoNav";
import CampoCorSecao, { OPCOES_COR_SECAO, OPCOES_COR_PUBLICA } from "./CampoCorSecao";
import CampoCheckbox from "./CampoCheckbox";
import CabecalhoSecao from "./CabecalhoSecao";
import { contraste } from "@/lib/contraste";
import { resolverCorHex } from "@/lib/cores";
import styles from "./EdicaoForm.module.scss";

const LIMIAR_CONTRASTE_TEXTO = 4.5;
const LIMIAR_CONTRASTE_ICONE = 3;

// Avisos de contraste de um estado (Topo/Rolado) — null quando não há fundo
// fixo pra comparar (Topo transparente, sem cor sólida definida).
function avisosDeContraste(hexFundo, hexTexto, hexIcone) {
  if (!hexFundo) return { texto: null, icone: null };
  const contrasteTexto = hexTexto ? contraste(hexFundo, hexTexto) : null;
  const contrasteIcone = hexIcone ? contraste(hexFundo, hexIcone) : null;
  return {
    texto: contrasteTexto !== null && contrasteTexto < LIMIAR_CONTRASTE_TEXTO ? contrasteTexto : null,
    icone: contrasteIcone !== null && contrasteIcone < LIMIAR_CONTRASTE_ICONE ? contrasteIcone : null,
  };
}

export default function SecaoNavegacao({
  fundoNavTopoTipo,
  corFundoNavTopo,
  corTextoNavTopo,
  corIconeNavTopo,
  corBordaNavTopo,
  corFundoNavRolado,
  corTextoNavRolado,
  corIconeNavRolado,
  corBordaNavRolado,
  navMesmoEstilo,
  aoMudarFundoNavTopoTipo,
  aoMudarCorFundoNavTopo,
  aoMudarCorTextoNavTopo,
  aoMudarCorIconeNavTopo,
  aoMudarCorBordaNavTopo,
  aoMudarCorFundoNavRolado,
  aoMudarCorTextoNavRolado,
  aoMudarCorIconeNavRolado,
  aoMudarCorBordaNavRolado,
  aoMudarNavMesmoEstilo,
}) {
  const hexFundoTopo = fundoNavTopoTipo === "COR" ? resolverCorHex(corFundoNavTopo, OPCOES_COR_SECAO) : null;
  const hexTextoTopo = resolverCorHex(corTextoNavTopo, OPCOES_COR_PUBLICA);
  const hexIconeTopo = resolverCorHex(corIconeNavTopo, OPCOES_COR_PUBLICA);
  const hexBordaTopo = resolverCorHex(corBordaNavTopo, OPCOES_COR_PUBLICA);

  const hexFundoRolado = resolverCorHex(corFundoNavRolado, OPCOES_COR_SECAO);
  const hexTextoRolado = resolverCorHex(corTextoNavRolado, OPCOES_COR_PUBLICA);
  const hexIconeRolado = resolverCorHex(corIconeNavRolado, OPCOES_COR_PUBLICA);
  const hexBordaRolado = resolverCorHex(corBordaNavRolado, OPCOES_COR_PUBLICA);

  const avisosTopo = avisosDeContraste(hexFundoTopo, hexTextoTopo, hexIconeTopo);
  const avisosRolado = navMesmoEstilo ? { texto: null, icone: null } : avisosDeContraste(hexFundoRolado, hexTextoRolado, hexIconeRolado);

  return (
    <div className={styles.secao}>
      <CabecalhoSecao
        Icone={Navigation}
        titulo="Barra de navegação"
        descricao="Cores do menu no topo da página e ao rolar."
      />
      <div className={styles.camposSecao}>
        <CampoFundoNav
          id="fundoNavTopoTipo"
          tipo={fundoNavTopoTipo}
          cor={corFundoNavTopo}
          aoMudarTipo={aoMudarFundoNavTopoTipo}
          aoMudarCor={aoMudarCorFundoNavTopo}
        />
        <CampoCorSecao
          id="corTextoNavTopo"
          rotulo="Cor do texto — topo"
          valor={corTextoNavTopo}
          opcoes={OPCOES_COR_PUBLICA}
          onChange={aoMudarCorTextoNavTopo}
        />
        <CampoCorSecao
          id="corIconeNavTopo"
          rotulo="Cor dos ícones — topo"
          valor={corIconeNavTopo}
          opcoes={OPCOES_COR_PUBLICA}
          onChange={aoMudarCorIconeNavTopo}
        />
        <CampoCorSecao
          id="corBordaNavTopo"
          rotulo="Cor da borda — topo"
          valor={corBordaNavTopo}
          opcoes={OPCOES_COR_PUBLICA}
          onChange={aoMudarCorBordaNavTopo}
        />

        {avisosTopo.texto !== null && (
          <p className={styles.avisoContraste}>
            Contraste baixo entre fundo e texto no topo ({avisosTopo.texto.toFixed(1)}:1 — mínimo recomendado {LIMIAR_CONTRASTE_TEXTO}:1). Pode ficar difícil de ler.
          </p>
        )}
        {avisosTopo.icone !== null && (
          <p className={styles.avisoContraste}>
            Contraste baixo entre fundo e ícones no topo ({avisosTopo.icone.toFixed(1)}:1 — mínimo recomendado {LIMIAR_CONTRASTE_ICONE}:1). Os ícones podem ficar difíceis de ver.
          </p>
        )}

        <CampoCheckbox
          id="navMesmoEstilo"
          rotulo="Usar a mesma cor para os dois estados"
          checked={navMesmoEstilo}
          onChange={aoMudarNavMesmoEstilo}
        />

        {!navMesmoEstilo && (
          <>
            <CampoCorSecao
              id="corFundoNavRolado"
              rotulo="Cor de fundo — ao rolar"
              valor={corFundoNavRolado}
              onChange={aoMudarCorFundoNavRolado}
            />
            <CampoCorSecao
              id="corTextoNavRolado"
              rotulo="Cor do texto — ao rolar"
              valor={corTextoNavRolado}
              opcoes={OPCOES_COR_PUBLICA}
              onChange={aoMudarCorTextoNavRolado}
            />
            <CampoCorSecao
              id="corIconeNavRolado"
              rotulo="Cor dos ícones — ao rolar"
              valor={corIconeNavRolado}
              opcoes={OPCOES_COR_PUBLICA}
              onChange={aoMudarCorIconeNavRolado}
            />
            <CampoCorSecao
              id="corBordaNavRolado"
              rotulo="Cor da borda — ao rolar"
              valor={corBordaNavRolado}
              opcoes={OPCOES_COR_PUBLICA}
              onChange={aoMudarCorBordaNavRolado}
            />

            {avisosRolado.texto !== null && (
              <p className={styles.avisoContraste}>
                Contraste baixo entre fundo e texto ao rolar ({avisosRolado.texto.toFixed(1)}:1 — mínimo recomendado {LIMIAR_CONTRASTE_TEXTO}:1). Pode ficar difícil de ler.
              </p>
            )}
            {avisosRolado.icone !== null && (
              <p className={styles.avisoContraste}>
                Contraste baixo entre fundo e ícones ao rolar ({avisosRolado.icone.toFixed(1)}:1 — mínimo recomendado {LIMIAR_CONTRASTE_ICONE}:1). Os ícones podem ficar difíceis de ver.
              </p>
            )}
          </>
        )}

        <div className={styles.linhaPreviewNav}>
          <div className={styles.blocoPreviewNav}>
            <span className={styles.rotuloPreviewHero}>Topo</span>
            <div
              className={styles.previewNav}
              style={{
                background: hexFundoTopo || "transparent",
                borderBottomColor: hexBordaTopo,
              }}
            >
              <span className={styles.previewNavIcone} style={{ background: hexIconeTopo }} aria-hidden="true" />
              <span className={styles.previewNavTexto} style={{ color: hexTextoTopo }}>Menu</span>
            </div>
          </div>
          <div className={styles.blocoPreviewNav}>
            <span className={styles.rotuloPreviewHero}>Ao rolar</span>
            <div
              className={styles.previewNav}
              style={{
                background: navMesmoEstilo ? hexFundoTopo || "transparent" : hexFundoRolado,
                borderBottomColor: navMesmoEstilo ? hexBordaTopo : hexBordaRolado,
              }}
            >
              <span
                className={styles.previewNavIcone}
                style={{ background: navMesmoEstilo ? hexIconeTopo : hexIconeRolado }}
                aria-hidden="true"
              />
              <span
                className={styles.previewNavTexto}
                style={{ color: navMesmoEstilo ? hexTextoTopo : hexTextoRolado }}
              >
                Menu
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
