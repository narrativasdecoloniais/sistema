import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import EdicaoForm from "@/components/interno/EdicaoForm";
import styles from "./page.module.scss";

export default async function PaginaEvento({ params }) {
  const [usuario, edicao] = await Promise.all([
    obterUsuarioAtual(),
    buscarEdicaoPorId(params.id),
  ]);
  if (!temPermissaoSecao(usuario, "CONFIGURACOES_EVENTO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }
  if (!edicao) notFound();

  return (
    <div className={styles.pagina}>
      <h1 className={styles.titulo}>Evento</h1>
      <EdicaoForm edicaoInicial={edicao} usuario={usuario} />
    </div>
  );
}
