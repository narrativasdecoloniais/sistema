"use client";

import { Checkbox } from "primereact/checkbox";
import styles from "./CampoPrime.module.scss";

export default function CampoCheckbox({ id, rotulo, checked, onChange, ...props }) {
  return (
    <div className={styles.grupoCheckbox}>
      <Checkbox
        inputId={id}
        checked={checked}
        onChange={(evento) => onChange(evento.checked)}
        pt={{
          root: { className: styles.raizCheckbox },
          input: { className: styles.inputOculto },
          box: { className: styles.caixa },
          icon: { className: styles.iconeCheck },
        }}
        {...props}
      />
      <label htmlFor={id} className={styles.rotuloCheckbox}>
        {rotulo}
      </label>
    </div>
  );
}
