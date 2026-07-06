import styles from "./Campo.module.scss";

export default function Campo({ rotulo, erro, id, ...props }) {
  return (
    <div className={styles.grupo}>
      <label htmlFor={id} className={styles.rotulo}>
        {rotulo}
      </label>
      <input id={id} className={`${styles.input} ${erro ? styles.comErro : ""}`} {...props} />
      {erro && <p className={styles.mensagemErro}>{erro}</p>}
    </div>
  );
}
