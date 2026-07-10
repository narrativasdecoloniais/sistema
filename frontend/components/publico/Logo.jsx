"use client";

import { motion, useReducedMotion } from "motion/react";
import LogoSimbolo from "@/components/graficos/LogoSimbolo";
import styles from "./Logo.module.scss";

const EASE_RODO = [0.16, 1, 0.3, 1];

// a pincelada oscila entre ~-35 e ~25 no espaço local do path — as margens
// abaixo garantem que ela começa totalmente acima da logo (nada revelado) e
// termina totalmente abaixo (0 a 896 revelado por completo).
const PINCELADA_Y_OCULTA = -40;
const PINCELADA_Y_REVELADA = 950;

const BASE_DURACAO = 4.5;
const COR_DELAY = 0.5;
const COR_DURACAO = 7.2;

// exportado pra quem precisa coreografar algo depois que a logo termina de entrar
export const LOGO_DURACAO_ENTRADA = COR_DELAY + COR_DURACAO;

export default function Logo({ tamanho = "pequena", animado = true }) {
  const reduzMovimento = useReducedMotion() || !animado;
  const tamanhoClasse = tamanho === "grande" ? styles.grande : styles.pequena;

  return (
    <div className={`${styles.moldura} ${tamanhoClasse}`}>
      <LogoSimbolo />

      <svg
        viewBox="0 0 778 896"
        aria-hidden="true"
        className={`${styles.imagem} ${styles.camadaBase}`}
      >
        <mask id="mascara-branca">
          <motion.g
            initial={reduzMovimento ? false : { y: PINCELADA_Y_OCULTA }}
            animate={{ y: PINCELADA_Y_REVELADA }}
            transition={
              reduzMovimento
                ? { duration: 0 }
                : { duration: BASE_DURACAO, ease: EASE_RODO }
            }
          >
            <use href="#pincelada-borda" fill="#fff" />
          </motion.g>
        </mask>
        <use
          href="#logo-narrativas-simbolo"
          width="100%"
          height="100%"
          className={styles.branca}
          mask="url(#mascara-branca)"
        />
      </svg>

      <svg
        viewBox="0 0 778 896"
        role="img"
        aria-label="Narrativas Interculturais, Decoloniais e Antirracistas em Educação"
        className={`${styles.imagemSobreposta} ${styles.camadaCor}`}
      >
        <mask id="mascara-colorida">
          <motion.g
            initial={reduzMovimento ? false : { y: PINCELADA_Y_OCULTA }}
            animate={{ y: PINCELADA_Y_REVELADA }}
            transition={
              reduzMovimento
                ? { duration: 0 }
                : { duration: COR_DURACAO, ease: EASE_RODO, delay: COR_DELAY }
            }
          >
            <use href="#pincelada-borda" fill="#fff" />
          </motion.g>
        </mask>
        <use
          href="#logo-narrativas-simbolo"
          width="100%"
          height="100%"
          className={styles.colorida}
          mask="url(#mascara-colorida)"
        />
      </svg>
    </div>
  );
}
