"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./ModalListaConteudo.module.scss";

const SELETOR_FOCAVEIS =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Mesmo padrão de acessibilidade de components/inscricao/ModalDetalhesAtividade.jsx
// (focus trap, ESC fecha, clique no fundo fecha, trava scroll do body, devolve
// foco ao fechar), sem fetch assíncrono: a lista já chega completa via prop
// (com seus itens), a lista pública já inclui tudo.
export default function ModalListaConteudo({ grupoNome, lista, aoFechar }) {
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

  function renderizarItem(item) {
    const conteudo = (
      <>
        {item.imagem && <img src={item.imagem} alt="" className={styles.itemLogo} />}
        <span>{item.nome}</span>
      </>
    );

    return item.link ? (
      <a href={item.link} target="_blank" rel="noopener noreferrer" className={styles.itemLink}>
        {conteudo}
      </a>
    ) : (
      <span className={styles.itemLinha}>{conteudo}</span>
    );
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
            <span className={styles.eyebrow}>{grupoNome}</span>
            <h2 id={idTitulo} className={`${styles.titulo} stencil`}>
              {lista.nome}
            </h2>
          </div>
          <button type="button" className={styles.fechar} onClick={aoFechar} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className={styles.conteudo}>
          <h3 className={styles.subtitulo}>Itens</h3>
          <ul className={styles.itensLista}>
            {lista.itens.map((item) => (
              <li key={item.id} className={styles.itensListaItem}>
                {renderizarItem(item)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>,
    document.body
  );
}
