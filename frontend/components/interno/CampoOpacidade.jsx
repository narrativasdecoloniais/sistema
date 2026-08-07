"use client";

import { useEffect, useState } from "react";
import { Slider } from "primereact/slider";
import stylesCampo from "./CampoPrime.module.scss";
import styles from "./CampoOpacidade.module.scss";

// Estado local espelha `valor` pra dar feedback instantâneo enquanto
// arrasta (onChange dispara a cada frame do drag); o salvamento em si só
// dispara em onSlideEnd (arrastar solto/tecla), mesmo motivo de
// CampoCoresLogo — senão cada arrastada vira uma rajada de PATCH.
export default function CampoOpacidade({ id, rotulo, valor, onChange }) {
  const [valorLocal, setValorLocal] = useState(valor);

  useEffect(() => {
    setValorLocal(valor);
  }, [valor]);

  return (
    <div className={stylesCampo.grupo}>
      <span className={stylesCampo.rotulo}>
        {rotulo} <span className={styles.valor}>{valorLocal}%</span>
      </span>
      <Slider
        inputId={id}
        value={valorLocal}
        min={0}
        max={100}
        onChange={(evento) => setValorLocal(evento.value)}
        onSlideEnd={(evento) => onChange(evento.value)}
        pt={{
          root: { className: styles.trilha },
          range: { className: styles.preenchido },
          handle: { className: styles.alca },
        }}
      />
    </div>
  );
}
