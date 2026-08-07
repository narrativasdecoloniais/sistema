import { redirect } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/auth";
import { PrimeReactProvider } from "primereact/api";
import Shell from "@/components/interno/Shell";
import ToastProvider from "@/components/interno/ToastProvider";
import styles from "./layout.module.scss";

export default async function LayoutInterno({ children }) {
  const usuario = await obterUsuarioAtual();

  if (!usuario) {
    redirect("/login");
  }

  return (
    <div className={styles.wrapper}>
      <PrimeReactProvider value={{ unstyled: true }}>
        <ToastProvider>
          <Shell usuario={usuario}>{children}</Shell>
        </ToastProvider>
      </PrimeReactProvider>
    </div>
  );
}
