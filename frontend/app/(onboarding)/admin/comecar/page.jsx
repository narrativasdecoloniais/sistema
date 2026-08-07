import { redirect } from "next/navigation";
import { listarEdicoes } from "@/lib/edicoes";
import EdicaoForm from "@/components/interno/EdicaoForm";
import styles from "./page.module.scss";

export default async function PaginaComecar() {
  const edicoes = await listarEdicoes();

  if (edicoes.length > 0) {
    redirect("/admin");
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.cartao}>
        <h1 className={styles.titulo}>Vamos criar a primeira edição</h1>
        <p className={styles.texto}>
          Antes de organizar atividades, inscrições e credenciamento, cadastre a
          primeira edição do Narrativas.
        </p>
        <EdicaoForm resumido />
      </div>
    </div>
  );
}
