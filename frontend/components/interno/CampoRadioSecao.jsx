"use client";

import { RadioButton } from "primereact/radiobutton";
import stylesCampo from "./CampoPrime.module.scss";
import styles from "./EdicaoForm.module.scss";

// Grupo de rádio genérico ({ valor, rotulo }) — mesmas classes de
// EdicaoForm.module.scss já usadas em SecaoLocal.jsx (modalidade), só que
// reutilizável em vez de hardcoded pras 3 opções de modalidade.
export default function CampoRadioSecao({ id, rotulo, valor, onChange, opcoes }) {
  return (
    <div className={stylesCampo.grupo}>
      {rotulo && <span className={stylesCampo.rotulo}>{rotulo}</span>}
      <div className={styles.grupoRadio}>
        {opcoes.map((opcao) => (
          <label key={opcao.valor} className={styles.opcaoRadio} htmlFor={`${id}-${opcao.valor}`}>
            <RadioButton
              inputId={`${id}-${opcao.valor}`}
              name={id}
              value={opcao.valor}
              checked={valor === opcao.valor}
              onChange={(evento) => onChange(evento.value)}
              pt={{
                root: { className: styles.raizRadio },
                input: { className: styles.inputOcultoRadio },
                box: { className: styles.caixaRadio },
              }}
            />
            {opcao.rotulo}
          </label>
        ))}
      </div>
    </div>
  );
}
