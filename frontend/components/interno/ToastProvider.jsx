"use client";

import { createContext, useCallback, useContext, useRef } from "react";
import { Toast } from "primereact/toast";
import { CircleCheck, CircleAlert, X } from "lucide-react";
import styles from "./ToastProvider.module.scss";

const ToastContext = createContext(null);

export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error("useToast precisa estar dentro de um ToastProvider");
  }
  return contexto;
}

export default function ToastProvider({ children }) {
  const toastRef = useRef(null);

  const notificar = useCallback((mensagem, tipo = "sucesso") => {
    const ehErro = tipo === "erro";

    toastRef.current?.show({
      severity: ehErro ? "error" : "success",
      detail: mensagem,
      life: 5000,
      icon: ehErro ? (
        <CircleAlert size={18} strokeWidth={1.5} aria-hidden="true" style={{ color: "var(--erro)" }} />
      ) : (
        <CircleCheck size={18} strokeWidth={1.5} aria-hidden="true" style={{ color: "var(--acento)" }} />
      ),
      closeIcon: <X size={16} strokeWidth={1.5} aria-hidden="true" />,
      pt: {
        root: { className: `${styles.toast} ${ehErro ? styles.erro : styles.sucesso}` },
        content: { className: styles.conteudo },
        text: { className: styles.texto },
        detail: { className: styles.detalhe },
        closeButton: { className: styles.fechar },
      },
    });
  }, []);

  return (
    <ToastContext.Provider value={{ notificar }}>
      {children}
      <Toast ref={toastRef} position="top-right" pt={{ root: { className: styles.regiao } }} />
    </ToastContext.Provider>
  );
}
