"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import MenuConta from "./MenuConta";
import EdicaoControles from "./EdicaoControles";
import NavegacaoEdicao from "./NavegacaoEdicao";
import BuziosSimbolos from "@/components/publico/buzios/BuziosSimbolos";
import { extrairContextoEdicao } from "@/lib/rotaEdicao";
import styles from "./Sidebar.module.scss";

export default function Sidebar({ usuario }) {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);
  const { id: idEdicaoAtual } = extrairContextoEdicao(pathname);
  const mostrarFerramentas = pathname.startsWith("/admin") && Boolean(idEdicaoAtual);

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  return (
    <aside className={`${styles.sidebar} ${menuAberto ? styles.menuAberto : ""}`}>
      <div className={styles.topo}>
        <div className={styles.topoEsquerda}>
          <div className={styles.marca}>
            <BuziosSimbolos />
            <svg viewBox="0 0 164 182" className={styles.buzio} aria-hidden="true">
              <use href="#buzio-simbolo-1" width="100%" height="100%" />
            </svg>
            <span className={`${styles.nome} stencil`}>Narrativas</span>
          </div>
          <EdicaoControles variante="mobile" usuario={usuario} />
        </div>
        <div className={styles.topoDireita}>
          <MenuConta usuario={usuario} variante="mobile" />
          {mostrarFerramentas && (
            <button
              type="button"
              className={styles.hamburguer}
              aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuAberto}
              aria-controls="menu-interno"
              onClick={() => setMenuAberto((aberto) => !aberto)}
            >
              <span className={styles.linhas}>
                <span className={styles.linha} />
                <span className={styles.linha} />
                <span className={styles.linha} />
              </span>
            </button>
          )}
        </div>
      </div>
      {mostrarFerramentas && (
        <nav id="menu-interno" className={styles.nav}>
          <NavegacaoEdicao idEdicaoAtual={idEdicaoAtual} />
        </nav>
      )}
    </aside>
  );
}
