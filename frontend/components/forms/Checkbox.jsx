import styles from "./Checkbox.module.scss";

export default function Checkbox({ id, rotulo, erro, checked, onChange }) {
  return (
    <div className={styles.grupo}>
      <label htmlFor={id} className={styles.linha}>
        <input
          id={id}
          type="checkbox"
          className={styles.input}
          checked={checked}
          onChange={onChange}
        />
        <span>{rotulo}</span>
      </label>
      {erro && <p className={styles.mensagemErro}>{erro}</p>}
    </div>
  );
}
