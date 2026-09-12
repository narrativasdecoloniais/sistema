import styles from "./CartoesContadores.module.scss";

export default function CartoesContadores({ itens }) {
  return (
    <div className={styles.linha}>
      {itens.map((item) => (
        <div key={item.rotulo} className={`${styles.cartao} ${item.tom ? styles[item.tom] : ""}`}>
          <span className={styles.valor}>{item.valor}</span>
          <span className={styles.rotulo}>{item.rotulo}</span>
        </div>
      ))}
    </div>
  );
}
