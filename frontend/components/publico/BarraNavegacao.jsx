"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Buzio from "./Buzio";
import styles from "./BarraNavegacao.module.scss";

const ANCORAS = [
  { href: "/#inscricoes", rotulo: "Inscrições" },
  { href: "/#programacao", rotulo: "Programação" },
  { href: "/#eixos", rotulo: "Eixos" },
  { href: "/#anais", rotulo: "Anais" },
];

export default function BarraNavegacao() {
  const pathname = usePathname();
  const naHome = pathname === "/";
  const [visivel, setVisivel] = useState(!naHome);

  useEffect(() => {
    if (!naHome) {
      setVisivel(true);
      return undefined;
    }

    setVisivel(false);
    const heroEl = document.getElementById("hero-landing");
    if (!heroEl) {
      setVisivel(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entrada]) => setVisivel(!entrada.isIntersecting),
      { threshold: 0, rootMargin: "-1px 0px 0px 0px" }
    );
    observer.observe(heroEl);
    return () => observer.disconnect();
  }, [naHome]);

  return (
    <nav
      aria-label="Navegação principal"
      className={`${styles.barra} ${naHome ? styles.sobreposta : styles.emFluxo} ${
        naHome && !visivel ? styles.oculta : ""
      }`}
    >
      <Link href="/" className={styles.voltarTopo} aria-label="Voltar ao topo">
        <Buzio className={styles.buzioIcone} />
      </Link>
      <ul className={styles.ancoras}>
        {ANCORAS.map((ancora) => (
          <li key={ancora.href}>
            <Link href={ancora.href}>{ancora.rotulo}</Link>
          </li>
        ))}
      </ul>
      <Link href="/login" className={styles.entrar}>
        Entrar
      </Link>
    </nav>
  );
}
