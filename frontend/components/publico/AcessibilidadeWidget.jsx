"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import IconeAcessibilidade from "@/components/graficos/IconeAcessibilidade";
import styles from "./AcessibilidadeWidget.module.scss";

const CHAVE_ARMAZENAMENTO = "narrativas:acessibilidade";
const NIVEIS_FONTE = [100, 112.5, 125, 137.5];
const NIVEL_MAXIMO = NIVEIS_FONTE.length - 1;

function aplicarPreferencias({ fonte, contraste }) {
  const raiz = document.documentElement;
  for (let nivel = 1; nivel <= NIVEL_MAXIMO; nivel += 1) {
    raiz.classList.remove(`acessibilidade-fonte-${nivel}`);
  }
  if (fonte > 0) raiz.classList.add(`acessibilidade-fonte-${fonte}`);
  if (contraste) raiz.setAttribute("data-alto-contraste", "true");
  else raiz.removeAttribute("data-alto-contraste");
}

// Botão flutuante fixo (canto inferior direito, empilhado acima de
// BotaoContatoFlutuante/VLibrasWidget — ver bottom em
// AcessibilidadeWidget.module.scss) em todas as páginas públicas
// (renderizado por app/(publico)/layout.jsx). Controla tamanho de texto (4
// níveis, aplicados como classe em <html> pra escalar todo `rem` da página)
// e alto contraste (atributo em <html>, lido pelo override de tokens em
// layout.module.scss). Preferência persistida em localStorage e reaplicada
// sem flash por um script inline no layout (ver comentário lá). Mesmo padrão
// de popover leve (sem backdrop/focus-trap) de BotaoContatoFlutuante.
export default function AcessibilidadeWidget() {
  const [aberto, setAberto] = useState(false);
  const [fonte, setFonte] = useState(0);
  const [contraste, setContraste] = useState(false);
  const raizRef = useRef(null);
  const botaoRef = useRef(null);
  const idPopover = useId();

  useEffect(() => {
    try {
      const dados = JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO) || "{}");
      setFonte(Number.isInteger(dados.fonte) ? Math.min(dados.fonte, NIVEL_MAXIMO) : 0);
      setContraste(Boolean(dados.contraste));
    } catch {
      // localStorage indisponível (modo privado etc.) — segue com os padrões.
    }
  }, []);

  useEffect(() => {
    aplicarPreferencias({ fonte, contraste });
    try {
      localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify({ fonte, contraste }));
    } catch {
      // idem — preferência só não persiste entre visitas.
    }
  }, [fonte, contraste]);

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

  const diminuirFonte = useCallback(() => setFonte((valor) => Math.max(0, valor - 1)), []);
  const aumentarFonte = useCallback(
    () => setFonte((valor) => Math.min(NIVEL_MAXIMO, valor + 1)),
    []
  );

  return (
    <div className={styles.raiz} ref={raizRef}>
      {aberto && (
        <div
          id={idPopover}
          className={styles.popover}
          role="region"
          aria-label="Opções de acessibilidade"
        >
          <span className={styles.rotulo}>Acessibilidade</span>

          <div className={styles.controle}>
            <span className={styles.controleRotulo}>
              Tamanho do texto <strong>{NIVEIS_FONTE[fonte]}%</strong>
            </span>
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.stepperBotao}
                onClick={diminuirFonte}
                disabled={fonte === 0}
                aria-label="Diminuir tamanho do texto"
              >
                A−
              </button>
              <button
                type="button"
                className={styles.stepperBotao}
                onClick={aumentarFonte}
                disabled={fonte === NIVEL_MAXIMO}
                aria-label="Aumentar tamanho do texto"
              >
                A+
              </button>
            </div>
          </div>

          <button
            type="button"
            className={styles.alternador}
            onClick={() => setContraste((valor) => !valor)}
            aria-pressed={contraste}
          >
            <span>Alto contraste</span>
            <span className={styles.chave} data-ativo={contraste} aria-hidden="true">
              <span className={styles.chaveBolinha} />
            </span>
          </button>
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
        aria-label="Opções de acessibilidade"
      >
        <IconeAcessibilidade tamanho={24} />
      </button>
    </div>
  );
}
