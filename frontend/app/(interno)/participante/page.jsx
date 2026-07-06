import { obterUsuarioAtual } from "@/lib/auth";
import PerfilForm from "./PerfilForm";
import styles from "./page.module.scss";

export default async function PaginaParticipante() {
  const usuario = await obterUsuarioAtual();

  return (
    <div className={styles.pagina}>
      <h1 className={styles.titulo}>Meu perfil</h1>
      <PerfilForm usuarioInicial={usuario} />
    </div>
  );
}
