"use client";

import { InputTextarea } from "primereact/inputtextarea";
import styles from "./CampoPrime.module.scss";

export default function CampoArea({ id, rotulo, erro, linhas = 6, ...props }) {
  const idErro = `${id}-erro`;

  return (
    <div className={styles.grupo}>
      <label htmlFor={id} className={styles.rotulo}>
        {rotulo}
      </label>
      <InputTextarea
        id={id}
        rows={linhas}
        invalid={Boolean(erro)}
        aria-invalid={erro ? "true" : undefined}
        aria-describedby={erro ? idErro : undefined}
        pt={{
          root: { className: `${styles.entrada} ${styles.textarea} ${erro ? styles.invalido : ""}` },
        }}
        {...props}
      />
      {erro && (
        <p id={idErro} className={styles.mensagemErro}>
          {erro}
        </p>
      )}
    </div>
  );
}
