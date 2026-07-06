"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import Logo from "@/components/publico/Logo";
import Buzio from "@/components/publico/Buzio";
import BuzioGrafico from "@/components/graficos/Buzio";
import Carimbo from "@/components/graficos/Carimbo";
import Divisor from "@/components/graficos/Divisor";
import TexturaPapel from "@/components/graficos/TexturaPapel";
import styles from "./page.module.scss";

const secaoVariants = {
  oculto: { opacity: 0, y: 32 },
  visivel: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function Marcador({ numero }) {
  return (
    <div className={styles.marcador}>
      <BuzioGrafico tamanho={26} className={styles.marcadorBuzio} />
      <span className={`${styles.marcadorEyebrow} stencil`}>{numero}</span>
    </div>
  );
}

function SeloEmBreve() {
  return (
    <span className={styles.seloEmBreve}>
      <Carimbo />
      <span>Em breve</span>
    </span>
  );
}

export default function PaginaInicial() {
  const reduzMovimento = useReducedMotion();

  return (
    <>
      <header id="hero-landing" className={styles.hero}>
        <Link href="/login" className={styles.entrarCarimbo}>
          <Carimbo />
          <span>Entrar</span>
        </Link>

        <motion.div
          className={styles.logoWrapper}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <Logo tamanho="grande" />
        </motion.div>

        <h1 className={styles.srOnly}>
          Narrativas Interculturais, Decoloniais e Antirracistas em Educação
        </h1>

        <p className={styles.legendas}>
          <span>V Edição</span>
          <span>Data a confirmar</span>
          <span>UnB · Brasília-DF</span>
          <span>Realização: GPDES/UnB</span>
        </p>

        <a href="#inscricoes" className={styles.convite}>
          <span className={`${styles.conviteTexto} stencil`}>Inscrições ↓</span>
          <motion.span
            className={styles.conviteBuzio}
            animate={reduzMovimento ? { y: 0 } : { y: [0, 6, 0] }}
            transition={
              reduzMovimento ? { duration: 0 } : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <Buzio className={styles.buzioIcone} />
          </motion.span>
        </a>
      </header>

      <motion.section
        id="inscricoes"
        className={`${styles.secao} ${styles.papel} ${styles.secaoPrincipal}`}
        initial="oculto"
        whileInView="visivel"
        viewport={{ once: true, margin: "-80px" }}
        variants={secaoVariants}
      >
        <div className={styles.divisorSecao}>
          <Divisor />
        </div>
        <Marcador numero="01" />
        <div className={styles.divisorColuna}>
          <Divisor orientacao="vertical" />
        </div>
        <div className={styles.conteudo}>
          <h2 className={styles.tituloPrincipal}>Inscrições</h2>
          <p className={styles.secaoTextoGrande}>
            Um espaço de encontro entre pesquisadoras, pesquisadores, docentes,
            estudantes e comunidade para pensar educação a partir de outras
            epistemologias.
          </p>
          <Link href="/cadastro" className={styles.cta}>
            Inscreva-se
          </Link>
          <p className={styles.notaRodape}>
            Participantes credenciados recebem certificado de participação
            emitido pela organização do evento.
          </p>
        </div>
      </motion.section>

      <motion.section
        id="programacao"
        className={`${styles.secao} ${styles.areia}`}
        initial="oculto"
        whileInView="visivel"
        viewport={{ once: true, margin: "-80px" }}
        variants={secaoVariants}
      >
        <TexturaPapel className={styles.textura} />
        <div className={styles.divisorSecao}>
          <Divisor />
        </div>
        <Marcador numero="02" />
        <div className={styles.divisorColuna}>
          <Divisor orientacao="vertical" />
        </div>
        <div className={styles.conteudo}>
          <h2 className={styles.tituloSecundario}>Programação</h2>
          <p className={styles.secaoTexto}>
            Mesas, oficinas e rodas de conversa ao longo de toda a edição — em
            breve com inscrições por atividade.
          </p>
        </div>
      </motion.section>

      <motion.section
        id="eixos"
        className={`${styles.secao} ${styles.cerrado}`}
        initial="oculto"
        whileInView="visivel"
        viewport={{ once: true, margin: "-80px" }}
        variants={secaoVariants}
      >
        <div className={styles.divisorSecao}>
          <Divisor />
        </div>
        <Marcador numero="03" />
        <div className={styles.divisorColuna}>
          <Divisor orientacao="vertical" />
        </div>
        <div className={styles.conteudo}>
          <div className={styles.tituloLinha}>
            <h2 className={styles.tituloSecundario}>Eixos</h2>
            <SeloEmBreve />
          </div>
          <p className={styles.secaoTexto}>
            Os eixos temáticos desta edição serão anunciados em breve — cada um
            vai organizar mesas, oficinas e rodas de conversa em torno de uma
            pergunta comum sobre educação, interculturalidade e antirracismo.
          </p>
        </div>
      </motion.section>

      <motion.section
        id="anais"
        className={`${styles.secao} ${styles.areia}`}
        initial="oculto"
        whileInView="visivel"
        viewport={{ once: true, margin: "-80px" }}
        variants={secaoVariants}
      >
        <TexturaPapel className={styles.textura} />
        <div className={styles.divisorSecao}>
          <Divisor />
        </div>
        <Marcador numero="04" />
        <div className={styles.divisorColuna}>
          <Divisor orientacao="vertical" />
        </div>
        <div className={styles.conteudo}>
          <div className={styles.tituloLinha}>
            <h2 className={styles.tituloSecundario}>Anais</h2>
            <SeloEmBreve />
          </div>
          <p className={styles.secaoTexto}>
            Em breve abriremos a chamada para submissão de trabalhos desta
            edição. Os anais das edições anteriores serão disponibilizados aqui
            assim que organizados.
          </p>
        </div>
      </motion.section>
    </>
  );
}
