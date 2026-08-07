"use client";

import { useEffect, useState } from "react";
import stylesCampo from "./CampoPrime.module.scss";
import styles from "./CampoCoresLogo.module.scss";

// Uma amostra por cor detectada no SVG enviado (ver sanitizarSvgLogo.js, que
// reescreve fill/stroke/stop-color pra var(--logo-cor-N) e devolve o mapa
// nome->hex). Cor livre (input nativo), não a paleta curada — são as cores
// da arte do gestor, não tokens do design system.
//
// Estado local espelha `cores` pra dar feedback instantâneo enquanto arrasta
// no seletor nativo (que dispara onChange continuamente); o salvamento em si
// só dispara em onBlur (picker fechado), senão cada arrastada vira uma
// rajada de PATCH.
export default function CampoCoresLogo({ cores, onChange }) {
  const [coresLocais, setCoresLocais] = useState(cores || {});

  useEffect(() => {
    setCoresLocais(cores || {});
  }, [cores]);

  const entradas = Object.entries(coresLocais);
  if (entradas.length === 0) return null;

  function aoMudarCor(variavel, novoHex) {
    setCoresLocais((atual) => ({ ...atual, [variavel]: novoHex }));
  }

  return (
    <div className={stylesCampo.grupo}>
      <span className={stylesCampo.rotulo}>Cores da logo</span>
      <div className={styles.lista}>
        {entradas.map(([variavel, hex], indice) => (
          <label key={variavel} className={styles.item}>
            <input
              type="color"
              value={hex}
              onChange={(evento) => aoMudarCor(variavel, evento.target.value)}
              onBlur={() => onChange(coresLocais)}
              className={styles.seletor}
            />
            <span className={styles.rotuloItem}>Cor {indice + 1}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
