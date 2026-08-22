import styles from "./LinhaProgramacao.module.scss";

export default function LinhaProgramacao({ hora, horaFim, children }) {
  return (
    <div className={styles.linha}>
      <div className={styles.colunaHora}>
        <span className={styles.marcador} aria-hidden="true" />
        <span className={styles.hora}>{hora}</span>
        <span className={styles.linhaVertical} aria-hidden="true" />
        {horaFim && <span className={styles.horaFim}>{horaFim}</span>}
      </div>
      <div className={styles.conteudo}>{children}</div>
    </div>
  );
}
