"use client";

import { useEffect, useRef, useState } from "react";
import Logo from "@/components/publico/Logo";
import styles from "./apresentacao.module.scss";

// a animação de entrada da logo dura ~7.7s (ver LOGO_DURACAO_ENTRADA em
// Logo.jsx). Montar a <Logo> assim que a página carrega faria a animação
// terminar antes de quem lê rolar até aqui — por isso ela só monta (e só
// então começa a animar) quando esta moldura entra na viewport.
export default function LogoEmDestaque() {
  const [visivel, setVisivel] = useState(false);
  const [ciclo, setCiclo] = useState(0);
  const molduraRef = useRef(null);

  useEffect(() => {
    const elemento = molduraRef.current;
    if (!elemento) return;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true);
          observador.disconnect();
        }
      },
      { threshold: 0.5 },
    );

    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return (
    <div className={styles.logoDestaqueBloco}>
      <div ref={molduraRef} className={styles.logoDestaqueMoldura}>
        {visivel && <Logo key={ciclo} tamanho="grande" />}
      </div>
      <button
        type="button"
        className={styles.replayBotao}
        onClick={() => setCiclo((c) => c + 1)}
      >
        ↻ Repetir animação
      </button>
    </div>
  );
}
