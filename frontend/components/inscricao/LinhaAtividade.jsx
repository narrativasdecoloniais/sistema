import styles from "./LinhaAtividade.module.scss";

export default function LinhaAtividade({ hora, children }) {
  return (
    <div className={styles.linha}>
      <span className={styles.hora}>{hora}</span>
      <div className={styles.conteudo}>{children}</div>
    </div>
  );
}
