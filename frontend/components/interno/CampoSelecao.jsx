import styles from "./CampoPrime.module.scss";

export default function CampoSelecao({ id, rotulo, erro, children, ...props }) {
  const idErro = `${id}-erro`;

  return (
    <div className={styles.grupo}>
      <label htmlFor={id} className={styles.rotulo}>
        {rotulo}
      </label>
      <select
        id={id}
        className={`${styles.entrada} ${erro ? styles.invalido : ""}`}
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
