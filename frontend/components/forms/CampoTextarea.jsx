import styles from "./Campo.module.scss";

export default function CampoTextarea({ rotulo, erro, id, linhas = 5, ...props }) {
  const idErro = `${id}-erro`;

  return (
    <div className={styles.grupo}>
      <label htmlFor={id} className={styles.rotulo}>
        {rotulo}
      </label>
      <textarea
        id={id}
        rows={linhas}
        className={`${styles.input} ${styles.textarea} ${erro ? styles.comErro : ""}`}
        aria-invalid={erro ? "true" : undefined}
        aria-describedby={erro ? idErro : undefined}
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
