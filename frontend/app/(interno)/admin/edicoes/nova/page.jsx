import { redirect } from "next/navigation";
import { obterUsuarioAtual, temPapel } from "@/lib/auth";
import { listarEdicoes } from "@/lib/edicoes";
import EdicaoForm from "@/components/interno/EdicaoForm";
import styles from "./page.module.scss";

export default async function PaginaNovaEdicao() {
  const usuario = await obterUsuarioAtual();
  if (!temPapel(usuario, "ADMIN")) {
    redirect("/admin");
  }

  const edicoes = await listarEdicoes();

  if (edicoes.length === 0) {
    redirect("/admin/comecar");
  }

  return (
    <div className={styles.pagina}>
      <h1 className={styles.titulo}>Nova edição</h1>
      <EdicaoForm resumido />
    </div>
  );
}
