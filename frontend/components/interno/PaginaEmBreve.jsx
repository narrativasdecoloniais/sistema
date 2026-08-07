import styles from "./PaginaEmBreve.module.scss";

export default function PaginaEmBreve({ titulo, descricao }) {
  return (
    <div className={styles.pagina}>
      <h1 className={styles.titulo}>{titulo}</h1>
      <p className={styles.texto}>
        {descricao || "Essa funcionalidade ainda não foi implementada."}
      </p>
    </div>
  );
}
