import styles from "./Alerta.module.scss";

export default function Alerta({ tipo = "erro", children }) {
  if (!children) return null;

  return (
    <p
      className={`${styles.alerta} ${tipo === "sucesso" ? styles.sucesso : styles.erro}`}
      role={tipo === "sucesso" ? "status" : "alert"}
    >
      {children}
    </p>
  );
}
