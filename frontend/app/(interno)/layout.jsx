import { redirect } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/auth";
import Shell from "@/components/interno/Shell";
import styles from "./layout.module.scss";

export default async function LayoutInterno({ children }) {
  const usuario = await obterUsuarioAtual();

  if (!usuario) {
    redirect("/login");
  }

  return (
    <div className={styles.wrapper}>
      <Shell usuario={usuario}>{children}</Shell>
    </div>
  );
}
