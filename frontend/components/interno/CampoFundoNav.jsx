import CampoCorSecao from "./CampoCorSecao";
import CampoRadioSecao from "./CampoRadioSecao";
import stylesCampo from "./CampoPrime.module.scss";
import styles from "./EdicaoForm.module.scss";

const OPCOES_TIPO_FUNDO_NAV = [
  { valor: "TRANSPARENTE", rotulo: "Transparente" },
  { valor: "COR", rotulo: "Cor sólida" },
];

// Fundo do estado "Topo" da navbar — só cor sólida ou transparente (sem
// opacidade, sem imagem, ao contrário de CampoFundoHero). Transparente deixa
// a Hero aparecer por trás, comportamento atual da navbar antes de rolar.
export default function CampoFundoNav({ id, tipo, cor, aoMudarTipo, aoMudarCor }) {
  return (
    <div className={styles.blocoFaixaHero}>
      <span className={stylesCampo.rotulo}>Fundo</span>
      <CampoRadioSecao id={id} valor={tipo} opcoes={OPCOES_TIPO_FUNDO_NAV} onChange={aoMudarTipo} />

      {tipo === "COR" && (
        <CampoCorSecao id={`${id}Cor`} rotulo="Cor de fundo" valor={cor} onChange={aoMudarCor} />
      )}
    </div>
  );
}
