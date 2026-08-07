"use client";

import { InputNumber } from "primereact/inputnumber";
import styles from "./CampoPrime.module.scss";

export default function CampoNumero({ id, rotulo, erro, ...props }) {
  const idErro = `${id}-erro`;

  return (
    <div className={styles.grupo}>
      <label htmlFor={id} className={styles.rotulo}>
        {rotulo}
      </label>
      <InputNumber
        inputId={id}
        useGrouping={false}
        invalid={Boolean(erro)}
        aria-invalid={erro ? "true" : undefined}
        aria-describedby={erro ? idErro : undefined}
        pt={{
          root: { className: styles.grupoNumero },
          input: { root: { className: `${styles.entrada} ${erro ? styles.invalido : ""}` } },
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
