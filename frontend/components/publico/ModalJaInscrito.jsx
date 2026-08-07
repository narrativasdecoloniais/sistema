"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./ModalJaInscrito.module.scss";

const SELETOR_FOCAVEIS =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Mesmo comportamento de acessibilidade de components/interno/Modal.jsx
// (focus trap, ESC fecha, clique no fundo fecha, trava scroll do body),
// mas com tokens públicos e sem ícone Lucide no fechar (proibido no
// público — DESIGN.md).
export default function ModalJaInscrito({ nomeEdicao, cpf, onFechar }) {
  const linkEntrar = cpf ? `/login?cpf=${encodeURIComponent(cpf)}` : "/login";

  const painelRef = useRef(null);
  const idTitulo = "modal-ja-inscrito-titulo";

  useEffect(() => {
    const elementoAnterior = document.activeElement;
    document.body.style.overflow = "hidden";

    const primeiroFocavel = painelRef.current?.querySelector(SELETOR_FOCAVEIS);
    primeiroFocavel?.focus();

    function aoPressionarTecla(evento) {
      if (evento.key === "Escape") {
        onFechar();
        return;
      }

      if (evento.key === "Tab" && painelRef.current) {
        const focaveis = painelRef.current.querySelectorAll(SELETOR_FOCAVEIS);
        if (focaveis.length === 0) return;

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
      elementoAnterior?.focus?.();
    };
  }, [onFechar]);

  function aoClicarFundo(evento) {
    if (evento.target === evento.currentTarget) {
      onFechar();
    }
  }

  return (
    <div className={styles.fundo} onClick={aoClicarFundo}>
      <div
        className={styles.painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        ref={painelRef}
      >
        <div className={styles.cabecalho}>
          <h2 id={idTitulo} className={styles.titulo}>
            Você já está inscrito(a)
          </h2>
          <button type="button" className={styles.fechar} onClick={onFechar} aria-label="Fechar">
            ×
          </button>
        </div>
        <div className={styles.conteudo}>
          <p className={styles.mensagem}>
            Você já está inscrito(a) na edição <strong>{nomeEdicao || "atual"}</strong>. Para
            gerenciar sua inscrição — editar, cancelar ou se inscrever em outras atividades —
            faça login no sistema.
          </p>
          <div className={styles.acoes}>
            <Link href={linkEntrar} className={styles.entrar}>
              Entrar
            </Link>
            <button type="button" className={styles.voltar} onClick={onFechar}>
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
