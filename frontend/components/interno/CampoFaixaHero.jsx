import CampoLogo from "./CampoLogo";
import CampoCorSecao, { OPCOES_COR_PUBLICA } from "./CampoCorSecao";
import CampoRadioSecao from "./CampoRadioSecao";
import CampoNumero from "./CampoNumero";
import stylesCampo from "./CampoPrime.module.scss";
import styles from "./EdicaoForm.module.scss";

const OPCOES_TIPO_FAIXA = [
  { valor: "COR", rotulo: "Cor sólida" },
  { valor: "IMAGEM", rotulo: "Imagem" },
  { valor: "NENHUMA", rotulo: "Nenhuma" },
];

// Um bloco "tipo (cor/imagem/nenhuma) + campo correspondente" — reaproveitado
// pra desktop e mobile, que podem ter configurações totalmente independentes
// (ver SecaoHero.jsx: a faixa fica bem mais estreita no mobile, então o
// gestor pode preferir só cor sólida lá e uma imagem no desktop, ou vice-versa,
// ou nem mostrar a faixa em algum dos dois).
export default function CampoFaixaHero({
  id,
  titulo,
  tipo,
  cor,
  imagem,
  largura,
  aoMudarTipo,
  aoMudarCor,
  aoMudarImagem,
  aoMudarLargura,
}) {
  const usaImagem = tipo === "IMAGEM";
  const usaCor = tipo === "COR";

  return (
    <div className={styles.blocoFaixaHero}>
      <span className={stylesCampo.rotulo}>{titulo}</span>
      <CampoRadioSecao
        id={`${id}-tipo`}
        valor={tipo}
        opcoes={OPCOES_TIPO_FAIXA}
        onChange={aoMudarTipo}
      />
      {tipo !== "NENHUMA" && (
        <CampoNumero
          id={`${id}-largura`}
          rotulo="Largura da faixa (px)"
          value={largura}
          onValueChange={(evento) => aoMudarLargura(evento.value)}
          min={1}
        />
      )}
      {usaImagem && (
        <>
          <CampoLogo id={`${id}-imagem`} rotulo="Imagem da faixa" valor={imagem} onChange={aoMudarImagem} />
          <p className={styles.avisoContraste}>
            Recomendado: imagem quadrada de ~192×192px, em PNG ou WebP (aceita fundo transparente — o transparente deixa aparecer o que estiver atrás da faixa, útil pra formas como um serrilhado). Ela repete verticalmente ao longo de toda a faixa; pra um padrão contínuo sem emenda visível, garanta que o topo encaixe com a base da imagem.
          </p>
        </>
      )}
      {usaCor && (
        <CampoCorSecao
          id={`${id}-cor`}
          rotulo="Cor da faixa"
          valor={cor}
          opcoes={OPCOES_COR_PUBLICA}
          onChange={aoMudarCor}
        />
      )}
    </div>
  );
}
