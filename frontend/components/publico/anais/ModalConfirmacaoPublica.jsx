"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./ModalConfirmacaoPublica.module.scss";

const SELETOR_FOCAVEIS = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Confirmação de ação destrutiva no site público (pele pública) — mesmo
// comportamento acessível do ModalResumoTrabalho: focus trap, ESC fecha,
// trava o scroll e devolve o foco.
export default function ModalConfirmacaoPublica({ titulo, mensagem, rotuloConfirmar, carregando, aoConfirmar, aoCancelar }) {
  const painelRef = useRef(null);
  const idTitulo = useId();
  const idMensagem = useId();

  useEffect(() => {
    const anterior = document.activeElement;
    document.body.style.overflow = "hidden";
    painelRef.current?.querySelector(SELETOR_FOCAVEIS)?.focus();

    function aoPressionarTecla(evento) {
      if (evento.key === "Escape") {
        aoCancelar();
        return;
      }
      if (evento.key === "Tab" && painelRef.current) {
        const focaveis = painelRef.current.querySelectorAll(SELETOR_FOCAVEIS);
        if (!focaveis.length) return;
        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];
        if (evento.shiftKey && document.activeElement === primeiro) {
          evento.preventDefault();
          ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
          evento.preventDefault();
          primeiro.focus();
        }
      }
    }

    document.addEventListener("keydown", aoPressionarTecla);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", aoPressionarTecla);
      anterior?.focus?.();
    };
  }, [aoCancelar]);

  return createPortal(
    <div
      className={styles.fundo}
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) aoCancelar();
      }}
    >
      <div
        className={styles.painel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idMensagem}
        ref={painelRef}
      >
        <h2 id={idTitulo} className={styles.titulo}>
          {titulo}
        </h2>
        <p id={idMensagem} className={styles.mensagem}>
          {mensagem}
        </p>
        <div className={styles.acoes}>
          <button type="button" className={styles.cancelar} onClick={aoCancelar} disabled={carregando}>
            Cancelar
          </button>
          <button type="button" className={styles.confirmar} onClick={aoConfirmar} disabled={carregando}>
            {carregando ? "Aguarde…" : rotuloConfirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
