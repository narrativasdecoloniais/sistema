"use client";

import { useEffect, useId, useRef, useState } from "react";
import IconeEnvelope from "@/components/graficos/IconeEnvelope";
import { useToast } from "./ToastProvider";
import styles from "./BotaoContatoFlutuante.module.scss";

// Botão flutuante fixo (canto inferior direito) em todas as páginas
// públicas (renderizado por app/(publico)/layout.jsx) — revela o e-mail de
// contato da edição num popover leve (não é modal: sem backdrop, sem
// focus-trap, página continua interativa por trás). Fecha ao clicar fora,
// Esc ou clicar no botão de novo — mesmo padrão de MenuConta.jsx (admin).
//
// Nota pra quando o VLibras for integrado (DESIGN.md prevê compatibilidade
// com o widget, ainda não implementado neste projeto): ele costuma ocupar o
// mesmo canto inferior direito — conferir sobreposição de z-index/posição
// antes de adicionar o script.
export default function BotaoContatoFlutuante({ email }) {
  const [aberto, setAberto] = useState(false);
  const raizRef = useRef(null);
  const botaoRef = useRef(null);
  const idPopover = useId();
  const { notificar } = useToast();

  useEffect(() => {
    if (!aberto) return undefined;

    function aoClicarFora(evento) {
      if (raizRef.current && !raizRef.current.contains(evento.target)) {
        setAberto(false);
      }
    }

    function aoPressionarTecla(evento) {
      if (evento.key === "Escape") {
        setAberto(false);
        botaoRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoPressionarTecla);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoPressionarTecla);
    };
  }, [aberto]);

  if (!email) return null;

  async function aoCopiar() {
    try {
      await navigator.clipboard.writeText(email);
      notificar("E-mail copiado.");
    } catch {
      notificar("Não foi possível copiar. Copie o e-mail manualmente.", "erro");
    }
  }

  return (
    <div className={styles.raiz} ref={raizRef}>
      {aberto && (
        <div id={idPopover} className={styles.popover} role="region" aria-label="E-mail de contato">
          <span className={styles.rotulo}>Fale com a organização</span>
          <div className={styles.linha}>
            <code className={styles.valor}>{email}</code>
            <button type="button" className={styles.botaoCopiar} onClick={aoCopiar}>
              Copiar
            </button>
          </div>
        </div>
      )}
      <button
        ref={botaoRef}
        type="button"
        className={styles.botao}
        onClick={() => setAberto((valor) => !valor)}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        aria-controls={idPopover}
        aria-label="Falar com a organização por e-mail"
      >
        <IconeEnvelope tamanho={22} />
      </button>
    </div>
  );
}
