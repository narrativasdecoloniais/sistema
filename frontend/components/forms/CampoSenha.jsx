"use client";

import { useState } from "react";
import styles from "./Campo.module.scss";

export default function CampoSenha({ rotulo, erro, id, value, onChange, ...props }) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className={styles.grupo}>
      <label htmlFor={id} className={styles.rotulo}>
        {rotulo}
      </label>
      <div className={styles.campoComBotao}>
        <input
          id={id}
          type={visivel ? "text" : "password"}
          className={`${styles.input} ${erro ? styles.comErro : ""}`}
          value={value}
          onChange={onChange}
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
      {erro && <p className={styles.mensagemErro}>{erro}</p>}
    </div>
  );
}
