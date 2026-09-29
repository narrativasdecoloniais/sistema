import { redirect } from "next/navigation";
import { PrimeReactProvider } from "primereact/api";
import { obterUsuarioAtual } from "@/lib/auth";
import ToastProvider from "@/components/interno/ToastProvider";
import styles from "./layout.module.scss";

// Telas de foco (abertas em nova aba a partir do admin): mesmos providers e
// tokens da área interna, mas sem Sidebar/Topbar.
export default async function LayoutEditor({ children }) {
  const usuario = await obterUsuarioAtual();
  if (!usuario) redirect("/login");

  return (
    <div className={styles.wrapper}>
      <PrimeReactProvider value={{ unstyled: true }}>
        <ToastProvider>{children}</ToastProvider>
      </PrimeReactProvider>
    </div>
  );
}
