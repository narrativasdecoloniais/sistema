"use client";

import { InputText } from "primereact/inputtext";
import styles from "./CampoPrime.module.scss";

export default function CampoTexto({ id, rotulo, erro, ...props }) {
  const idErro = `${id}-erro`;

  return (
    <div className={styles.grupo}>
      <label htmlFor={id} className={styles.rotulo}>
        {rotulo}
      </label>
      <InputText
        id={id}
        invalid={Boolean(erro)}
        aria-invalid={erro ? "true" : undefined}
        aria-describedby={erro ? idErro : undefined}
        pt={{
          root: { className: `${styles.entrada} ${erro ? styles.invalido : ""}` },
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
