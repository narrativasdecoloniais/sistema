"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "./Marcador.module.scss";

// três búzios "caídos" em ângulos e atrasos levemente diferentes, como se
// tivessem sido lançados juntos e assentado em momentos distintos. Copiado
// de frontend/app/(publico)/PaginaInicialConteudo.jsx (Marcador da home) —
// duplicado de propósito em vez de importado de lá, pra nenhuma mudança
// aqui arriscar regressão na home (página animada já em produção).
const itemVariants = {
  oculto: { opacity: 0, y: 20 },
  visivel: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const buzioLancadoA = {
  oculto: { opacity: 0, scale: 0.5, rotate: -55, x: -14, y: -12 },
  visivel: {
    opacity: 1,
    scale: 1,
    rotate: -8,
    x: 0,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const buzioLancadoB = {
  oculto: { opacity: 0, scale: 0.45, rotate: 45, x: 12, y: -8 },
  visivel: {
    opacity: 1,
    scale: 1,
    rotate: 10,
    x: 0,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", delay: 0.12 },
  },
};

const buzioLancadoC = {
  oculto: { opacity: 0, scale: 0.4, rotate: -25, x: 4, y: 12 },
  visivel: {
    opacity: 1,
    scale: 1,
    rotate: 3,
    x: 0,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", delay: 0.22 },
  },
};

// deriva contínua pós-pouso — aproxima e afasta do centro do cluster, feito
// respirando. Cada array começa no ângulo de repouso do respectivo búzio
// (visivel.rotate) pra não dar salto quando o loop assume o controle.
const derivaA = { x: [0, -3, 0], y: [0, 3, 0], rotate: [-8, -12, -8] };
const derivaB = { x: [0, 3, 0], y: [0, -2, 0], rotate: [10, 14, 10] };
const derivaC = { x: [0, -2, 0], y: [0, -3, 0], rotate: [3, 7, 3] };

function BuzioCaido({
  viewBox,
  simbolo,
  variants,
  deriva,
  atraso,
  className,
  emVista,
}) {
  const reduzMovimento = useReducedMotion();
  const [pousou, setPousou] = useState(false);

  useEffect(() => {
    if (!emVista) setPousou(false);
  }, [emVista]);

  const emDeriva = emVista && pousou && !reduzMovimento;

  return (
    <motion.svg
      viewBox={viewBox}
      aria-hidden="true"
      className={className}
      variants={variants}
      onAnimationComplete={() => {
        if (emVista) setPousou(true);
      }}
      animate={emDeriva ? deriva : undefined}
      transition={
        emDeriva
          ? {
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: atraso,
            }
          : undefined
      }
    >
      <use href={`#${simbolo}`} width="100%" height="100%" />
    </motion.svg>
  );
}

// Cluster de três búzios "caídos" com animação de queda ao entrar em
// viewport + deriva contínua depois. A cor vem só de --cor-buzio-secao,
// herdada via CSS do elemento ancestral que a página-mãe definir (ver
// Marcador.module.scss) — este componente não recebe prop de cor.
// BuziosSimbolos (o sprite com os 3 <symbol>) precisa estar montado em
// algum lugar da árvore — já é o caso em toda página pública, montado
// globalmente por BarraNavegacao.jsx.
export default function Marcador() {
  const [emVista, setEmVista] = useState(false);

  return (
    <motion.div
      className={styles.marcador}
      variants={itemVariants}
      initial="oculto"
      whileInView="visivel"
      viewport={{ once: false, margin: "-80px" }}
      onViewportEnter={() => setEmVista(true)}
      onViewportLeave={() => setEmVista(false)}
    >
      <span className={styles.marcadorBuzios}>
        <BuzioCaido
          viewBox="0 0 164 182"
          simbolo="buzio-simbolo-1"
          variants={buzioLancadoA}
          deriva={derivaA}
          atraso={0}
          emVista={emVista}
          className={`${styles.marcadorBuzio} ${styles.marcadorBuzioA}`}
        />
        <BuzioCaido
          viewBox="0 0 148 197"
          simbolo="buzio-simbolo-2"
          variants={buzioLancadoB}
          deriva={derivaB}
          atraso={0.4}
          emVista={emVista}
          className={`${styles.marcadorBuzio} ${styles.marcadorBuzioB}`}
        />
        <BuzioCaido
          viewBox="0 0 152 196"
          simbolo="buzio-simbolo-3"
          variants={buzioLancadoC}
          deriva={derivaC}
          atraso={0.8}
          emVista={emVista}
          className={`${styles.marcadorBuzio} ${styles.marcadorBuzioC}`}
        />
      </span>
    </motion.div>
  );
}
