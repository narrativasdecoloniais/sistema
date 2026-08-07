import styles from "./Avatar.module.scss";

export default function Avatar({ usuario, tamanho = 40 }) {
  const nome = usuario?.nome?.trim() || "";
  const inicial = nome ? nome[0].toUpperCase() : "?";
  const estilo = { width: tamanho, height: tamanho, fontSize: Math.round(tamanho * 0.42) };

  if (usuario?.foto) {
    return (
      <img
        src={usuario.foto}
        alt={nome ? `Foto de ${nome}` : "Foto do usuário"}
        className={styles.avatar}
        style={estilo}
      />
    );
  }

  return (
    <div
      className={styles.avatar}
      style={estilo}
      role="img"
      aria-label={nome ? `Foto de ${nome}` : "Usuário sem foto"}
    >
      {inicial}
    </div>
  );
}
