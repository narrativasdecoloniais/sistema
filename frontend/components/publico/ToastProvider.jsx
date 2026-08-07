"use client";

import { createContext, useCallback, useContext, useRef } from "react";
import { Toast } from "primereact/toast";
import styles from "./ToastProvider.module.scss";

const ToastContext = createContext(null);

export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error("useToast precisa estar dentro de um ToastProvider");
  }
  return contexto;
}

// Mesma API de components/interno/ToastProvider.jsx, mas sem ícone (site
// público não usa ícones de UI kit — DESIGN.md) e sem botão de fechar (o
// PrimeReact usa um ícone de "x" pra isso também) — o toast some sozinho
// depois de `life`.
export default function ToastProvider({ children }) {
  const toastRef = useRef(null);

  const notificar = useCallback((mensagem, tipo = "sucesso") => {
    const ehErro = tipo === "erro";

    toastRef.current?.show({
      severity: ehErro ? "error" : "success",
      detail: mensagem,
      life: 5000,
      closable: false,
      pt: {
        root: { className: `${styles.toast} ${ehErro ? styles.erro : styles.sucesso}` },
        content: { className: styles.conteudo },
        icon: { className: styles.iconeOculto },
        text: { className: styles.texto },
        detail: { className: styles.detalhe },
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
