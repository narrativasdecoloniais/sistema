"use client";

import { Slider } from "primereact/slider";
import stylesCampo from "./CampoPrime.module.scss";
import styles from "./CampoOpacidade.module.scss";

// Slider com o valor ao lado do rótulo, que atualiza a cada movimento — pra
// ajustes com prévia local (ex. margens do certificado), sem salvar nada no
// arrasto. Setas do teclado ajustam de `passo` em `passo`.
export default function CampoIntervalo({ id, rotulo, valor, onChange, min, max, passo = 1, unidade = "", erro }) {
  const idErro = `${id}-erro`;
  const texto = Number.isInteger(passo) ? valor : Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 2 });

  return (
    <div className={stylesCampo.grupo}>
      <span className={stylesCampo.rotulo} id={`${id}-rotulo`}>
        {rotulo}{" "}
        <span className={styles.valor}>
          {texto}
          {unidade}
        </span>
      </span>
      <Slider
        inputId={id}
        value={valor}
        min={min}
        max={max}
        step={passo}
        onChange={(evento) => onChange(evento.value)}
        aria-labelledby={`${id}-rotulo`}
        aria-describedby={erro ? idErro : undefined}
        pt={{
          root: { className: styles.trilha },
          range: { className: styles.preenchido },
          handle: { className: styles.alca },
        }}
      />
      {erro && (
        <p id={idErro} className={stylesCampo.mensagemErro}>
          {erro}
        </p>
      )}
    </div>
  );
}
