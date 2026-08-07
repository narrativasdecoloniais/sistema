import styles from "./EdicaoForm.module.scss";

export default function CabecalhoSecao({ Icone, titulo, descricao, perigo }) {
  return (
    <div className={styles.cabecalhoSecao}>
      <div className={`${styles.iconeSecao} ${perigo ? styles.iconeSecaoPerigo : ""}`}>
        <Icone size={20} strokeWidth={1.5} aria-hidden="true" />
      </div>
      <div className={styles.textoCabecalho}>
        <h2 className={styles.tituloSecao}>{titulo}</h2>
        {descricao && <p className={styles.descricaoSecao}>{descricao}</p>}
      </div>
    </div>
  );
}
