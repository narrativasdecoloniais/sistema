"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import IconeAcessibilidade from "@/components/graficos/IconeAcessibilidade";
import IconeLupaMais from "@/components/graficos/IconeLupaMais";
import IconeLupaMenos from "@/components/graficos/IconeLupaMenos";
import IconeEscalaCinza from "@/components/graficos/IconeEscalaCinza";
import IconeContrasteAuto from "@/components/graficos/IconeContrasteAuto";
import IconeContrasteAlto from "@/components/graficos/IconeContrasteAlto";
import IconeContrasteNegativo from "@/components/graficos/IconeContrasteNegativo";
import IconeFundoClaro from "@/components/graficos/IconeFundoClaro";
import IconeLinkSublinhado from "@/components/graficos/IconeLinkSublinhado";
import IconeFonteLegivel from "@/components/graficos/IconeFonteLegivel";
import IconeRedefinir from "@/components/graficos/IconeRedefinir";
import styles from "./AcessibilidadeWidget.module.scss";

const CHAVE_ARMAZENAMENTO = "narrativas:acessibilidade";
const NIVEIS_FONTE = [100, 112.5, 125, 137.5];
const NIVEL_MAXIMO = NIVEIS_FONTE.length - 1;

// Grupo de modos visuais mutuamente exclusivos (ativar um desliga os outros)
// — combinar filtro de cinza/inversão com troca de paleta produz resultados
// incoerentes, então só um fica ativo por vez. "alto-contraste"/"fundo-claro"
// trocam a camada de tokens de cor (ver (publico)/layout.module.scss);
// "cinza"/"auto-contraste"/"negativo" aplicam `filter` em `body` (ver
// styles/globals.scss) — os dois mecanismos convivem porque nunca ficam
// ativos ao mesmo tempo.
const MODOS_VISUAIS = [
  { valor: "cinza", rotulo: "Escala de cinza", Icone: IconeEscalaCinza },
  { valor: "auto-contraste", rotulo: "Auto contraste", Icone: IconeContrasteAuto },
  { valor: "alto-contraste", rotulo: "Alto contraste", Icone: IconeContrasteAlto },
  { valor: "negativo", rotulo: "Contraste negativo", Icone: IconeContrasteNegativo },
  { valor: "fundo-claro", rotulo: "Fundo claro", Icone: IconeFundoClaro },
];

const PADRAO = {
  fonte: 0,
  modoVisual: null,
  linksSublinhados: false,
  fonteLegivel: false,
};

function aplicarPreferencias({ fonte, modoVisual, linksSublinhados, fonteLegivel }) {
  const raiz = document.documentElement;
  for (let nivel = 1; nivel <= NIVEL_MAXIMO; nivel += 1) {
    raiz.classList.remove(`acessibilidade-fonte-${nivel}`);
  }
  if (fonte > 0) raiz.classList.add(`acessibilidade-fonte-${fonte}`);

  if (modoVisual) raiz.setAttribute("data-modo-visual", modoVisual);
  else raiz.removeAttribute("data-modo-visual");

  raiz.toggleAttribute("data-links-sublinhados", Boolean(linksSublinhados));
  raiz.toggleAttribute("data-fonte-legivel", Boolean(fonteLegivel));
}

// Botão flutuante fixo (canto inferior direito, empilhado acima de
// BotaoContatoFlutuante/VLibrasWidget — ver bottom em
// AcessibilidadeWidget.module.scss) em todas as páginas públicas
// (renderizado por app/(publico)/layout.jsx). Controla tamanho de texto (4
// níveis, aplicados como classe em <html> pra escalar todo `rem` da página),
// um modo visual exclusivo (escala de cinza / auto contraste / alto
// contraste / contraste negativo / fundo claro — atributo `data-modo-visual`
// em <html>) e dois ajustes independentes (links sublinhados, fonte
// legível — atributos booleanos em <html>). Preferência persistida em
// localStorage e reaplicada sem flash por um script inline no layout (ver
// comentário lá). Mesmo padrão de popover leve (sem backdrop/focus-trap) de
// BotaoContatoFlutuante.
export default function AcessibilidadeWidget() {
  const [aberto, setAberto] = useState(false);
  const [fonte, setFonte] = useState(PADRAO.fonte);
  const [modoVisual, setModoVisual] = useState(PADRAO.modoVisual);
  const [linksSublinhados, setLinksSublinhados] = useState(PADRAO.linksSublinhados);
  const [fonteLegivel, setFonteLegivel] = useState(PADRAO.fonteLegivel);
  const raizRef = useRef(null);
  const botaoRef = useRef(null);
  const idPopover = useId();

  useEffect(() => {
    try {
      const dados = JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO) || "{}");
      setFonte(Number.isInteger(dados.fonte) ? Math.min(dados.fonte, NIVEL_MAXIMO) : 0);
      // "contraste" é o formato antigo (só um boolean de alto contraste) —
      // migra pra "alto-contraste" no novo grupo de modo visual único.
      setModoVisual(dados.modoVisual ?? (dados.contraste ? "alto-contraste" : null));
      setLinksSublinhados(Boolean(dados.linksSublinhados));
      setFonteLegivel(Boolean(dados.fonteLegivel));
    } catch {
      // localStorage indisponível (modo privado etc.) — segue com os padrões.
    }
  }, []);

  useEffect(() => {
    const preferencias = { fonte, modoVisual, linksSublinhados, fonteLegivel };
    aplicarPreferencias(preferencias);
    try {
      localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(preferencias));
    } catch {
      // idem — preferência só não persiste entre visitas.
    }
  }, [fonte, modoVisual, linksSublinhados, fonteLegivel]);

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
  const alternarModoVisual = useCallback((valor) => {
    setModoVisual((atual) => (atual === valor ? null : valor));
  }, []);
  const redefinir = useCallback(() => {
    setFonte(PADRAO.fonte);
    setModoVisual(PADRAO.modoVisual);
    setLinksSublinhados(PADRAO.linksSublinhados);
    setFonteLegivel(PADRAO.fonteLegivel);
  }, []);

  return (
    <div className={styles.raiz} ref={raizRef}>
      {aberto && (
        <div
          id={idPopover}
          className={styles.popover}
          role="region"
          aria-label="Ferramentas de acessibilidade"
        >
          <span className={styles.rotulo}>Ferramentas de acessibilidade</span>

          <div className={styles.controle}>
            <span className={styles.controleRotulo}>
              Tamanho do texto <strong>{NIVEIS_FONTE[fonte]}%</strong>
            </span>
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.linha}
                onClick={aumentarFonte}
                disabled={fonte === NIVEL_MAXIMO}
              >
                <IconeLupaMais tamanho={20} />
                <span>Aumentar texto</span>
              </button>
              <button
                type="button"
                className={styles.linha}
                onClick={diminuirFonte}
                disabled={fonte === 0}
              >
                <IconeLupaMenos tamanho={20} />
                <span>Diminuir texto</span>
              </button>
            </div>
          </div>

          <div className={styles.grupo} role="group" aria-label="Modo de exibição">
            {MODOS_VISUAIS.map(({ valor, rotulo, Icone }) => (
              <button
                key={valor}
                type="button"
                className={styles.linha}
                onClick={() => alternarModoVisual(valor)}
                aria-pressed={modoVisual === valor}
                data-ativo={modoVisual === valor}
              >
                <Icone tamanho={20} />
                <span>{rotulo}</span>
              </button>
            ))}
          </div>

          <div className={styles.grupo}>
            <button
              type="button"
              className={styles.linha}
              onClick={() => setLinksSublinhados((valor) => !valor)}
              aria-pressed={linksSublinhados}
              data-ativo={linksSublinhados}
            >
              <IconeLinkSublinhado tamanho={20} />
              <span>Links sublinhados</span>
            </button>
            <button
              type="button"
              className={styles.linha}
              onClick={() => setFonteLegivel((valor) => !valor)}
              aria-pressed={fonteLegivel}
              data-ativo={fonteLegivel}
            >
              <IconeFonteLegivel tamanho={20} />
              <span>Fonte legível</span>
            </button>
          </div>

          <div className={styles.grupo}>
            <button type="button" className={styles.linha} onClick={redefinir}>
              <IconeRedefinir tamanho={20} />
              <span>Redefinir</span>
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
        aria-label="Ferramentas de acessibilidade"
      >
        <IconeAcessibilidade tamanho={24} />
      </button>
    </div>
  );
}
