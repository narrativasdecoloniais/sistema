import { redirect } from "next/navigation";
import { obterUsuarioAtual, temPapel } from "@/lib/auth";
import styles from "./page.module.scss";

export default async function PaginaAdmin() {
  const usuario = await obterUsuarioAtual();

  if (!temPapel(usuario, "ADMIN", "ORGANIZADOR")) {
    redirect("/participante");
  }

  return (
    <div className={styles.pagina}>
      <h1 className={styles.titulo}>Painel administrativo</h1>
      <p className={styles.texto}>
        O painel administrativo (edições, atividades, inscrições e credenciamento)
        será implementado no Módulo 2. Você está vendo esta página porque tem
        papel de organização no Narrativas.
      </p>
    </div>
  );
}
