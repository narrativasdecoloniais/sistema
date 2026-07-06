import styles from "./CartaoFormulario.module.scss";

export default function CartaoFormulario({ titulo, subtitulo, children }) {
  return (
    <div className={styles.pagina}>
      <div className={styles.cartao}>
        <h1 className={styles.titulo}>{titulo}</h1>
        {subtitulo && <p className={styles.subtitulo}>{subtitulo}</p>}
        {children}
      </div>
    </div>
  );
}
