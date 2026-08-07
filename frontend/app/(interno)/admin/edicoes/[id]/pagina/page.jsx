import { notFound } from "next/navigation";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import PaginaEventoForm from "@/components/interno/PaginaEventoForm";
import styles from "../page.module.scss";

export default async function PaginaPaginaEvento({ params }) {
  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  return (
    <div className={styles.pagina}>
      <h1 className={styles.titulo}>Página do evento</h1>
      <PaginaEventoForm edicaoInicial={edicao} />
    </div>
  );
}
