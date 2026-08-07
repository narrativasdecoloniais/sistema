"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "./Avatar";
import { useLogout } from "@/lib/useLogout";
import styles from "./MenuConta.module.scss";

export default function MenuConta({ usuario, variante }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const raizRef = useRef(null);
  const botaoRef = useRef(null);
  const { sair, saindo } = useLogout();
  const podeAdministrar = usuario?.papeis?.some((papel) =>
    ["ADMIN", "ORGANIZADOR"].includes(papel)
  );

  useEffect(() => {
    setAberto(false);
  }, [pathname]);

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

  const raizClasse = variante === "mobile" ? styles.raizMobile : styles.raizDesktop;
  const idPainel = `menu-conta-${variante}`;

  return (
    <div className={`${styles.raiz} ${raizClasse}`} ref={raizRef}>
      <button
        type="button"
        ref={botaoRef}
        className={`${styles.gatilho} ${variante === "mobile" ? styles.gatilhoMobile : ""}`}
        aria-haspopup="true"
        aria-expanded={aberto}
        aria-controls={idPainel}
        onClick={() => setAberto((atual) => !atual)}
      >
        <Avatar usuario={usuario} tamanho={36} />
      </button>
      {aberto && (
        <div
          id={idPainel}
          className={`${styles.painel} ${variante === "mobile" ? styles.painelMobile : styles.painelDesktop}`}
        >
          <Link href="/participante" className={styles.item}>
            Meu Perfil
          </Link>
          {podeAdministrar && (
            <Link href="/admin" className={styles.item}>
              Administração
            </Link>
          )}
          <div className={styles.divisorMenu} aria-hidden="true" />
          <button type="button" className={styles.item} onClick={sair} disabled={saindo}>
            {saindo ? "Saindo..." : "Sair"}
          </button>
        </div>
      )}
    </div>
  );
}
