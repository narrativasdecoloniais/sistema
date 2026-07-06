"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { RiUserAddLine, RiCalendarEventLine, RiCompass3Line, RiBook2Line } from "@remixicon/react";
import Logo from "@/components/publico/Logo";
import Buzio from "@/components/publico/Buzio";
import styles from "./page.module.scss";

const secaoVariants = {
  oculto: { opacity: 0, y: 32 },
  visivel: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function PaginaInicial() {
  const reduzMovimento = useReducedMotion();

  return (
    <>
      <header id="hero-landing" className={styles.hero}>
        <Link href="/login" className={styles.entrarCarimbo}>
          Entrar
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

        <a href="#programacao" className={styles.convite}>
          <span className={`${styles.conviteTexto} stencil`}>Programação ↓</span>
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
        className={styles.secao}
        initial="oculto"
        whileInView="visivel"
        viewport={{ once: true, margin: "-80px" }}
        variants={secaoVariants}
      >
        <div className={styles.secaoCabecalho}>
          <RiUserAddLine className={styles.secaoIcone} />
          <h2 className={styles.secaoTitulo}>Inscrições</h2>
        </div>
        <p className={styles.secaoTexto}>
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
      </motion.section>

      <motion.section
        id="programacao"
        className={styles.secao}
        initial="oculto"
        whileInView="visivel"
        viewport={{ once: true, margin: "-80px" }}
        variants={secaoVariants}
      >
        <div className={styles.secaoCabecalho}>
          <RiCalendarEventLine className={styles.secaoIcone} />
          <h2 className={styles.secaoTitulo}>Programação</h2>
        </div>
        <p className={styles.secaoTexto}>
          Mesas, oficinas e rodas de conversa ao longo de toda a edição — em
          breve com inscrições por atividade.
        </p>
      </motion.section>

      <motion.section
        id="eixos"
        className={styles.secao}
        initial="oculto"
        whileInView="visivel"
        viewport={{ once: true, margin: "-80px" }}
        variants={secaoVariants}
      >
        <div className={styles.secaoCabecalho}>
          <RiCompass3Line className={styles.secaoIcone} />
          <h2 className={styles.secaoTitulo}>Eixos</h2>
        </div>
        <p className={styles.secaoTexto}>
          Os eixos temáticos desta edição serão anunciados em breve — cada um
          vai organizar mesas, oficinas e rodas de conversa em torno de uma
          pergunta comum sobre educação, interculturalidade e antirracismo.
        </p>
      </motion.section>

      <motion.section
        id="anais"
        className={styles.secao}
        initial="oculto"
        whileInView="visivel"
        viewport={{ once: true, margin: "-80px" }}
        variants={secaoVariants}
      >
        <div className={styles.secaoCabecalho}>
          <RiBook2Line className={styles.secaoIcone} />
          <h2 className={styles.secaoTitulo}>Anais</h2>
        </div>
        <p className={styles.secaoTexto}>
          Em breve abriremos a chamada para submissão de trabalhos desta
          edição. Os anais das edições anteriores serão disponibilizados aqui
          assim que organizados.
        </p>
      </motion.section>
    </>
  );
}
