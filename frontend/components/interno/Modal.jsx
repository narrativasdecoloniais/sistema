"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import styles from "./Modal.module.scss";

const SELETOR_FOCAVEIS =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// `rodape` fica fixo embaixo, fora da rolagem (ações de formulários longos e
// do passo a passo da inscrição); `telaCheiaNoCelular` ocupa a tela inteira
// em telas estreitas.
export default function Modal({ titulo, onFechar, children, largo = false, rodape, telaCheiaNoCelular = false }) {
  const painelRef = useRef(null);
  const idTitulo = useId();
  // Quem chama costuma passar uma arrow nova a cada render; guardar no ref
  // evita refazer o efeito (e devolver o foco ao primeiro botão) a cada tecla.
  const onFecharRef = useRef(onFechar);
  onFecharRef.current = onFechar;

  useEffect(() => {
    const elementoAnterior = document.activeElement;
    document.body.style.overflow = "hidden";

    const primeiroFocavel = painelRef.current?.querySelector(SELETOR_FOCAVEIS);
    primeiroFocavel?.focus();

    function aoPressionarTecla(evento) {
      if (evento.key === "Escape") {
        onFecharRef.current();
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
  }, []);

  function aoClicarFundo(evento) {
    if (evento.target === evento.currentTarget) {
      onFechar();
    }
  }

  return (
    <div className={styles.fundo} onClick={aoClicarFundo}>
      <div
        className={[
          styles.painel,
          largo ? styles.painelLargo : "",
          rodape ? styles.painelComRodape : "",
          telaCheiaNoCelular ? styles.telaCheiaNoCelular : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        ref={painelRef}
      >
        <div className={styles.cabecalho}>
          <h2 id={idTitulo} className={styles.titulo}>
            {titulo}
          </h2>
          <button
            type="button"
            className={styles.fechar}
            onClick={onFechar}
            aria-label="Fechar"
          >
            <X size={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.conteudo}>{children}</div>
        {rodape && <div className={styles.rodape}>{rodape}</div>}
      </div>
    </div>
  );
}
