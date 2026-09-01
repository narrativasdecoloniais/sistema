import { obterUsuarioAtual } from "@/lib/auth";
import FormularioSubmissaoParticipante from "@/components/interno/FormularioSubmissaoParticipante";
import styles from "./page.module.scss";

export default async function PaginaNovaSubmissao() {
  const usuario = await obterUsuarioAtual();

  return (
    <div className={styles.pagina}>
      <h1 className={styles.titulo}>Nova submissão</h1>
      <FormularioSubmissaoParticipante nomeUsuario={usuario?.nome} />
    </div>
  );
}
