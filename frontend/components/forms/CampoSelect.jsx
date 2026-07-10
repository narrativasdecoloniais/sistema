import styles from "./Campo.module.scss";

export default function CampoSelect({ rotulo, erro, id, variante, children, ...props }) {
  const idErro = `${id}-erro`;

  return (
    <div className={styles.grupo}>
      <label htmlFor={id} className={styles.rotulo}>
        {rotulo}
      </label>
      <select
        id={id}
        className={`${styles.input} ${variante ? styles[variante] : ""} ${erro ? styles.comErro : ""}`}
        aria-invalid={erro ? "true" : undefined}
        aria-describedby={erro ? idErro : undefined}
        {...props}
      >
        {children}
      </select>
      {erro && (
        <p id={idErro} className={styles.mensagemErro}>
          {erro}
        </p>
      )}
    </div>
  );
}
