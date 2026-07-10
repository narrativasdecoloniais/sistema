"use client";

import { useState } from "react";
import styles from "./Campo.module.scss";

export default function CampoSenha({ rotulo, erro, id, value, onChange, variante, ...props }) {
  const [visivel, setVisivel] = useState(false);
  const idErro = `${id}-erro`;

  return (
    <div className={styles.grupo}>
      <label htmlFor={id} className={styles.rotulo}>
        {rotulo}
      </label>
      <div className={styles.campoComBotao}>
        <input
          id={id}
          type={visivel ? "text" : "password"}
          className={`${styles.input} ${variante ? styles[variante] : ""} ${erro ? styles.comErro : ""}`}
          value={value}
          onChange={onChange}
          aria-invalid={erro ? "true" : undefined}
          aria-describedby={erro ? idErro : undefined}
          {...props}
        />
        <button
          type="button"
          className={styles.botaoVisibilidade}
          onClick={() => setVisivel((atual) => !atual)}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        >
          {visivel ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {erro && (
        <p id={idErro} className={styles.mensagemErro}>
          {erro}
        </p>
      )}
    </div>
  );
}
