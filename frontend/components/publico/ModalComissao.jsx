"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./ModalComissao.module.scss";

const SELETOR_FOCAVEIS =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Mesmo padrão de acessibilidade de components/inscricao/ModalDetalhesAtividade.jsx
// (focus trap, ESC fecha, clique no fundo fecha, trava scroll do body, devolve
// foco ao fechar), mas sem fetch assíncrono: a comissão já chega completa via
// prop (tipoComissao + membros), a lista pública já inclui tudo.
export default function ModalComissao({ comissao, aoFechar }) {
  const painelRef = useRef(null);
  const idTitulo = useId();

  useEffect(() => {
    const elementoAnterior = document.activeElement;
    document.body.style.overflow = "hidden";

    const primeiroFocavel = painelRef.current?.querySelector(SELETOR_FOCAVEIS);
    primeiroFocavel?.focus();

    function aoPressionarTecla(evento) {
      if (evento.key === "Escape") {
        aoFechar();
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
  }, [aoFechar]);

  function aoClicarFundo(evento) {
    if (evento.target === evento.currentTarget) {
      aoFechar();
    }
  }

  return createPortal(
    <div className={styles.fundo} onClick={aoClicarFundo}>
      <div
        className={styles.painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        ref={painelRef}
      >
        <div className={styles.cabecalho}>
          <div className={styles.tituloBloco}>
            <span className={styles.eyebrow}>Comissão</span>
            <h2 id={idTitulo} className={`${styles.titulo} stencil`}>
              {comissao.tipoComissao.nome}
            </h2>
          </div>
          <button type="button" className={styles.fechar} onClick={aoFechar} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className={styles.conteudo}>
          <h3 className={styles.subtitulo}>Integrantes</h3>
          <ul className={styles.membrosLista}>
            {comissao.membros.map((membro) => (
              <li key={membro.id} className={styles.membrosItem}>
                {membro.nome}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>,
    document.body
  );
}
