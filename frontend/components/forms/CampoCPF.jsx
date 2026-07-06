import { formatarCpf } from "@/lib/cpf";
import styles from "./Campo.module.scss";

export default function CampoCPF({ rotulo, erro, id, value, onChange, ...props }) {
  function aoDigitar(evento) {
    evento.target.value = formatarCpf(evento.target.value);
    onChange(evento);
  }

  return (
    <div className={styles.grupo}>
      <label htmlFor={id} className={styles.rotulo}>
        {rotulo}
      </label>
      <input
        id={id}
        inputMode="numeric"
        placeholder="000.000.000-00"
        className={`${styles.input} ${erro ? styles.comErro : ""}`}
        value={value}
        onChange={aoDigitar}
        maxLength={14}
        {...props}
      />
      {erro && <p className={styles.mensagemErro}>{erro}</p>}
    </div>
  );
}
