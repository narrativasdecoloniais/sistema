"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import BuziosSimbolos from "@/components/publico/buzios/BuziosSimbolos";
import { paraNumeroRomano } from "@/lib/romanos";
import { estiloCoresPersonalizadas } from "@/lib/cores";
import { useEdicaoExibida } from "./EdicaoExibidaContext";
import styles from "./BarraNavegacao.module.scss";

const ANCORAS = [
  { href: "/#submissao", rotulo: "Submissão" },
  { href: "/#programacao", rotulo: "Programação" },
  { href: "/#anais", rotulo: "Anais" },
];

// mesma curva de easing usada na animação de entrada da logo — dá
// continuidade à "assinatura" de movimento do site
const EASE = [0.16, 1, 0.3, 1];

export default function BarraNavegacao({ numeroEdicao: numeroEdicaoProp }) {
  const edicaoExibida = useEdicaoExibida();
  const numeroEdicao = edicaoExibida ? edicaoExibida.numeroEdicao : numeroEdicaoProp;
  const nav = edicaoExibida?.navegacao;
  const pathname = usePathname();
  const naHome = pathname === "/";
  const [rolou, setRolou] = useState(!naHome);
  const [buzioAtivo, setBuzioAtivo] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const reduzMovimento = useReducedMotion();

  useEffect(() => {
    if (!naHome) {
      setRolou(true);
      return undefined;
    }

    const aoRolar = () => setRolou(window.scrollY > 10);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, [naHome]);

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  // trava o scroll da página por trás enquanto o menu cobre a tela inteira
  useEffect(() => {
    if (!menuAberto) return undefined;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuAberto]);

  function fecharMenu() {
    setMenuAberto(false);
  }

  // Resolve qual dos dois conjuntos de cor está ativo (Topo/Rolado) uma vez
  // por render — quando navMesmoEstilo está ligado, "rolado" nunca fica
  // ativo, então o estado de scroll deixa de mudar a cor (só a posição
  // .sobreposta/.emFluxo continua reagindo a naHome, sem relação com cor).
  const usarRolado = rolou && !nav?.navMesmoEstilo;
  const estiloNav = usarRolado ? nav?.rolado : nav?.topo;
  const fundoNavTipo = usarRolado ? "COR" : nav?.topo?.fundoTipo;

  const painelVariants = {
    oculto: {
      opacity: 0,
      transition: reduzMovimento ? { duration: 0 } : { duration: 0.2, ease: EASE },
    },
    visivel: {
      opacity: 1,
      transition: reduzMovimento
        ? { duration: 0 }
        : { duration: 0.3, ease: EASE, staggerChildren: 0.06, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    oculto: { opacity: 0, y: 12 },
    visivel: {
      opacity: 1,
      y: 0,
      transition: reduzMovimento ? { duration: 0 } : { duration: 0.35, ease: EASE },
    },
  };

  return (
    <nav
      aria-label="Navegação principal"
      className={`${styles.barra} ${naHome ? styles.sobreposta : styles.emFluxo} ${
        menuAberto ? styles.menuAberto : ""
      }`}
      data-fundo-nav-tipo={fundoNavTipo}
      data-cor-fundo-nav={estiloNav?.corFundo}
      data-cor-texto-nav={estiloNav?.corTexto}
      data-cor-icone-nav={estiloNav?.corIcone}
      data-cor-borda-nav={estiloNav?.corBorda}
      data-cor-fundo-botao-nav={nav?.corFundoBotaoNav}
      data-cor-texto-botao-nav={nav?.corTextoBotaoNav}
      style={{
        ...(nav
          ? {
              "--largura-faixa-hero-mobile-valor": `${nav.larguraFaixaMobile}px`,
              "--largura-faixa-hero-desktop-valor": `${nav.larguraFaixaDesktop}px`,
            }
          : {}),
        ...estiloCoresPersonalizadas({
          "--cor-fundo-nav": estiloNav?.corFundo,
          "--cor-texto-nav": estiloNav?.corTexto,
          "--cor-icone-nav": estiloNav?.corIcone,
          "--cor-borda-nav": estiloNav?.corBorda,
          "--cor-fundo-botao-nav": nav?.corFundoBotaoNav,
          "--cor-texto-botao-nav": nav?.corTextoBotaoNav,
        }),
      }}
    >
      <BuziosSimbolos />

      <AnimatePresence>
        {menuAberto && (
          <motion.div
            className={styles.painelMobile}
            initial="oculto"
            animate="visivel"
            exit="oculto"
            variants={painelVariants}
          >
            <motion.ul className={styles.ancorasMobile}>
              {ANCORAS.map((ancora) => (
                <motion.li key={ancora.href} variants={itemVariants}>
                  <Link href={ancora.href} onClick={fecharMenu}>
                    {ancora.rotulo}
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
            <motion.div className={styles.entrarMobileWrapper} variants={itemVariants}>
              <Link href="/login" className={styles.entrarMobile} onClick={fecharMenu}>
                Entrar
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {numeroEdicao && (
        <Link
          href="/"
          className={styles.selo}
          onMouseEnter={() => setBuzioAtivo(true)}
          onMouseLeave={() => setBuzioAtivo(false)}
          onFocus={() => setBuzioAtivo(true)}
          onBlur={() => setBuzioAtivo(false)}
        >
          {paraNumeroRomano(numeroEdicao)} Edição
        </Link>
      )}

      <motion.svg
        viewBox="0 0 164 182"
        className={styles.buzioIcone}
        aria-hidden="true"
        animate={
          reduzMovimento
            ? { rotate: 0, scale: 1 }
            : buzioAtivo
              ? { rotate: -10, scale: 1.08 }
              : { rotate: 0, scale: 1 }
        }
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
      >
        <use href="#buzio-simbolo-1" width="100%" height="100%" />
      </motion.svg>

      <ul className={styles.ancoras}>
        {ANCORAS.map((ancora) => (
          <li key={ancora.href}>
            <Link href={ancora.href} className={styles.ancoraBotao}>
              {ancora.rotulo}
            </Link>
          </li>
        ))}
      </ul>

      <svg
        viewBox="0 0 164 182"
        className={`${styles.buzioIcone} ${styles.buzioSeparador}`}
        aria-hidden="true"
      >
        <use href="#buzio-simbolo-1" width="100%" height="100%" />
      </svg>

      <Link href="/login" className={styles.entrar}>
        Entrar
      </Link>

      <button
        type="button"
        className={styles.hamburguer}
        aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
        aria-expanded={menuAberto}
        onClick={() => setMenuAberto((aberto) => !aberto)}
      >
        <motion.span
          className={styles.linha}
          initial={false}
          animate={menuAberto ? { y: 0, rotate: 45 } : { y: -7, rotate: 0 }}
          transition={reduzMovimento ? { duration: 0 } : { duration: 0.3, ease: EASE }}
        />
        <motion.span
          className={styles.linha}
          initial={false}
          animate={{ opacity: menuAberto ? 0 : 1 }}
          transition={reduzMovimento ? { duration: 0 } : { duration: 0.2 }}
        />
        <motion.span
          className={styles.linha}
          initial={false}
          animate={menuAberto ? { y: 0, rotate: -45 } : { y: 7, rotate: 0 }}
          transition={reduzMovimento ? { duration: 0 } : { duration: 0.3, ease: EASE }}
        />
      </button>
    </nav>
  );
}
