import { redirect } from "next/navigation";
import { obterUsuarioAtual, temPapel } from "@/lib/auth";
import { PrimeReactProvider } from "primereact/api";
import SairDiscreto from "@/components/interno/SairDiscreto";
import ToastProvider from "@/components/interno/ToastProvider";
import styles from "./layout.module.scss";

export default async function LayoutOnboarding({ children }) {
  const usuario = await obterUsuarioAtual();

  if (!usuario) {
    redirect("/login");
  }

  if (!temPapel(usuario, "ADMIN")) {
    redirect("/participante");
  }

  return (
    <div className={styles.wrapper}>
      <PrimeReactProvider value={{ unstyled: true }}>
        <ToastProvider>
          <SairDiscreto />
          {children}
        </ToastProvider>
      </PrimeReactProvider>
    </div>
  );
}
