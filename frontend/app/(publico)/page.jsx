"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { RiCalendarEventLine, RiAwardLine, RiFileUploadLine } from "@remixicon/react";
import Logo from "@/components/publico/Logo";
import styles from "./page.module.scss";

const blocos = [
  {
    icone: RiCalendarEventLine,
    titulo: "Programação",
    texto:
      "Mesas, oficinas e rodas de conversa ao longo de toda a edição — em breve com inscrições por atividade.",
  },
  {
    icone: RiAwardLine,
    titulo: "Certificação",
    texto:
      "Participantes credenciados recebem certificado de participação emitido pela organização do evento.",
  },
  {
    icone: RiFileUploadLine,
    titulo: "Submissão de trabalhos",
    texto: "Em breve abriremos a chamada para submissão de trabalhos para esta edição.",
  },
];

const itemVariants = {
  oculto: { opacity: 0, y: 24 },
  visivel: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function PaginaInicial() {
  return (
    <main>
      <section className={styles.hero}>
        <motion.div
          className={styles.seloWrapper}
          initial="oculto"
          animate="visivel"
          variants={itemVariants}
        >
          <motion.span
            className={styles.selo}
            animate={{ rotate: [-8, -4, -8] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            V EDIÇÃO 2026
          </motion.span>
        </motion.div>

        <motion.div
          className={styles.logoWrapper}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <Logo tamanho="grande" />
        </motion.div>

        <h1 className={styles.srOnly}>
          Narrativas Interculturais, Decoloniais e Antirracistas em Educação
        </h1>

        <motion.hr
          className={styles.linha}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        />

        <motion.p
          className={styles.subtitulo}
          initial="oculto"
          animate="visivel"
          variants={itemVariants}
          transition={{ delay: 0.7 }}
        >
          Um espaço de encontro entre pesquisadoras, pesquisadores, docentes,
          estudantes e comunidade para pensar educação a partir de outras
          epistemologias. Promovido pelo GPDES/UnB.
        </motion.p>

        <motion.div
          initial="oculto"
          animate="visivel"
          variants={itemVariants}
          transition={{ delay: 0.85 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className={styles.ctaWrapper}
        >
          <Link href="/cadastro" className={styles.cta}>
            Inscreva-se
          </Link>
        </motion.div>
      </section>

      <section className={styles.blocos}>
        {blocos.map((bloco, indice) => (
          <motion.div
            key={bloco.titulo}
            className={styles.bloco}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: indice * 0.12 }}
          >
            <bloco.icone className={styles.blocoIcone} />
            <h2 className={styles.blocoTitulo}>{bloco.titulo}</h2>
            <p className={styles.blocoTexto}>{bloco.texto}</p>
          </motion.div>
        ))}
      </section>
    </main>
  );
}
