"use client";

import { motion } from "motion/react";
import styles from "./Logotipo.module.scss";

// Grade 4x3 da palavra DECOLONIAIS — os dois "O" viram grãos de café.
const GRADE = [
  ["D", "E", "C", "grao"],
  ["L", "grao", "N", "I"],
  ["A", "", "I", "S"],
];

const containerVariants = {
  oculto: {},
  visivel: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
};

const letraVariants = {
  oculto: { opacity: 0, y: -20 },
  visivel: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const graoVariants = {
  oculto: { opacity: 0, scale: 0.3, rotate: -35 },
  visivel: { opacity: 1, scale: 1, rotate: 0, transition: { duration: 0.55, ease: "backOut" } },
};

function GraoCafe({ className }) {
  return (
    <svg viewBox="0 0 100 130" className={className} aria-hidden="true">
      <path
        d="M50,3 C82,3 97,38 97,66 C97,102 76,127 50,127 C24,127 3,102 3,66 C3,38 18,3 50,3 Z"
        fill="currentColor"
      />
      <path
        d="M52,18 C40,36 62,50 46,66 C34,80 56,96 50,112"
        stroke="#fff"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LinhaEspalhada({ texto, className, animado }) {
  if (!animado) {
    return (
      <div className={className}>
        {texto.split("").map((caractere, indice) => (
          <span key={indice}>{caractere === " " ? " " : caractere}</span>
        ))}
      </div>
    );
  }

  return (
    <motion.div className={className} variants={containerVariants}>
      {texto.split("").map((caractere, indice) => (
        <motion.span key={indice} variants={letraVariants}>
          {caractere === " " ? " " : caractere}
        </motion.span>
      ))}
    </motion.div>
  );
}

export default function Logotipo({ tamanho = "grande", animado = false }) {
  const classeTamanho = tamanho === "pequena" ? styles.pequena : "";

  const celulasGrade = GRADE.flat().map((item, indice) => {
    if (item === "grao") {
      return animado ? (
        <motion.div key={indice} className={styles.celula} variants={graoVariants}>
          <GraoCafe className={styles.grao} />
        </motion.div>
      ) : (
        <div key={indice} className={styles.celula}>
          <GraoCafe className={styles.grao} />
        </div>
      );
    }

    if (item === "") {
      return <div key={indice} className={styles.celula} aria-hidden="true" />;
    }

    return animado ? (
      <motion.div key={indice} className={styles.celula} variants={letraVariants}>
        {item}
      </motion.div>
    ) : (
      <div key={indice} className={styles.celula}>
        {item}
      </div>
    );
  });

  const conteudo = (
    <>
      <LinhaEspalhada texto="NARRATIVAS" className={styles.linhaTopo} animado={animado} />
      <LinhaEspalhada texto="INTERCULTURAIS," className={styles.linhaTopo} animado={animado} />
      {animado ? (
        <motion.div className={styles.grade} variants={containerVariants}>
          {celulasGrade}
        </motion.div>
      ) : (
        <div className={styles.grade}>{celulasGrade}</div>
      )}
      <LinhaEspalhada
        texto="E ANTIRRACISTAS EM EDUCAÇÃO"
        className={styles.linhaBase}
        animado={animado}
      />
    </>
  );

  if (!animado) {
    return (
      <div className={`${styles.logotipo} ${classeTamanho}`} aria-hidden="true">
        {conteudo}
      </div>
    );
  }

  return (
    <motion.div
      className={`${styles.logotipo} ${classeTamanho}`}
      variants={containerVariants}
      initial="oculto"
      animate="visivel"
      aria-hidden="true"
    >
      {conteudo}
    </motion.div>
  );
}
