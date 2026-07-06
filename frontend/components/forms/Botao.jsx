import styles from "./Botao.module.scss";

export default function Botao({ variante = "primario", carregando, children, ...props }) {
  return (
    <button
      className={`${styles.botao} ${styles[variante] || ""}`}
      disabled={carregando || props.disabled}
      {...props}
    >
      {carregando ? "Aguarde..." : children}
    </button>
  );
}
