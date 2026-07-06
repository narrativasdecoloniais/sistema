import styles from "./Campo.module.scss";

export default function CampoSelect({ rotulo, erro, id, children, ...props }) {
  return (
    <div className={styles.grupo}>
      <label htmlFor={id} className={styles.rotulo}>
        {rotulo}
      </label>
      <select id={id} className={`${styles.input} ${erro ? styles.comErro : ""}`} {...props}>
        {children}
      </select>
      {erro && <p className={styles.mensagemErro}>{erro}</p>}
    </div>
  );
}
