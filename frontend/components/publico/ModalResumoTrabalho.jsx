"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./ModalResumoTrabalho.module.scss";
import ConteudoRichText from "@/components/ConteudoRichText";

const SELETOR_FOCAVEIS = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Mesmo padrão de acessibilidade de components/inscricao/ModalDetalhesAtividade.jsx
// (focus trap, ESC e clique no fundo fecham, trava scroll, devolve o foco),
// também via portal para document.body.
export default function ModalResumoTrabalho({ trabalho, aoFechar }) {
  const painelRef = useRef(null);
  const idTitulo = useId();

  useEffect(() => {
    const elementoAnterior = document.activeElement;
    document.body.style.overflow = "hidden";
    painelRef.current?.querySelector(SELETOR_FOCAVEIS)?.focus();

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

  const meta = [trabalho.modalidadeSubmissao.nome, trabalho.areaSubmissao?.titulo].filter(Boolean).join(" · ");

  return createPortal(
    <div
      className={styles.fundo}
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) aoFechar();
      }}
    >
      <div className={styles.painel} role="dialog" aria-modal="true" aria-labelledby={idTitulo} ref={painelRef}>
        <div className={styles.cabecalho}>
          <div className={styles.tituloBloco}>
            <span className={styles.eyebrow}>{meta}</span>
            <h2 id={idTitulo} className={styles.titulo}>
              {trabalho.titulo}
            </h2>
            <p className={styles.autores}>{trabalho.autores.map((autor) => autor.nome).join(", ")}</p>
          </div>
          {/* glyph de texto, não ícone de biblioteca — proibido no público (DESIGN.md) */}
          <button type="button" className={styles.fechar} onClick={aoFechar} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className={styles.conteudo}>
          <section>
            <h3 className={styles.subtitulo}>Resumo</h3>
            <ConteudoRichText className={styles.corpo} html={trabalho.resumo} tipo="resumo" />
          </section>
          {trabalho.referenciaBibliografica && (
            <section>
              <h3 className={styles.subtitulo}>Referências</h3>
              <ConteudoRichText className={styles.corpo} html={trabalho.referenciaBibliografica} tipo="referencia" />
            </section>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
