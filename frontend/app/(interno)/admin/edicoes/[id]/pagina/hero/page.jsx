import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import HeroNavbarForm from "@/components/interno/HeroNavbarForm";
import styles from "../../page.module.scss";

export default async function PaginaHeroNavbar({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "PAGINA_EVENTO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  return (
    <div className={styles.pagina}>
      <h1 className={styles.titulo}>Hero + Navbar</h1>
      <HeroNavbarForm edicaoInicial={edicao} />
    </div>
  );
}
