"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import Logo, { LOGO_DURACAO_ENTRADA } from "@/components/publico/Logo";
import Carimbo from "@/components/graficos/Carimbo";
import Divisor from "@/components/graficos/Divisor";
import TexturaPapel from "@/components/graficos/TexturaPapel";
import {
  MODALIDADES_SUBMISSAO,
  formatarPeriodoSubmissao,
} from "@/lib/modalidadesSubmissao";
import styles from "./page.module.scss";

const containerVariants = {
  oculto: {},
  visivel: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const itemVariants = {
  oculto: { opacity: 0, y: 20 },
  visivel: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

// três búzios "caídos" em ângulos e atrasos levemente diferentes, como se
// tivessem sido lançados juntos e assentado em momentos distintos.
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

function Marcador() {
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

function Eyebrow({ children }) {
  return (
    <motion.span className={styles.eyebrow} variants={itemVariants}>
      {children}
    </motion.span>
  );
}

function SeloEmBreve({ children = "Em breve" }) {
  return (
    <span className={styles.seloEmBreve}>
      <Carimbo />
      <span>{children}</span>
    </span>
  );
}

export default function PaginaInicial() {
  const reduzMovimento = useReducedMotion();

  return (
    <>
      <header id="hero-landing" className={styles.hero}>
        <div className={styles.logoWrapper}>
          <Logo tamanho="grande" />
        </div>

        <h1 className={styles.srOnly}>
          Narrativas Interculturais, Decoloniais e Antirracistas em Educação
        </h1>

        <motion.p
          className={styles.legendas}
          initial={reduzMovimento ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduzMovimento
              ? { duration: 0 }
              : {
                  duration: 0.7,
                  ease: "easeOut",
                  delay: LOGO_DURACAO_ENTRADA / 4,
                }
          }
        >
          <span>Data a confirmar</span>
          <span>UnB · Brasília-DF</span>
          <span>Realização: GPDES/UnB</span>
        </motion.p>

        <motion.a
          href="#inscricoes"
          className={styles.convite}
          initial={reduzMovimento ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduzMovimento
              ? { duration: 0 }
              : {
                  duration: 0.7,
                  ease: "easeOut",
                  delay: LOGO_DURACAO_ENTRADA / 4 + 0.15,
                }
          }
        >
          <span className={`${styles.conviteTexto} stencil`}>Inscrições ↓</span>
          <motion.span
            className={styles.conviteBuzio}
            animate={
              reduzMovimento
                ? { y: 0, rotate: 0 }
                : { y: [0, 7, 0], rotate: [0, -6, 4, 0] }
            }
            transition={
              reduzMovimento
                ? { duration: 0 }
                : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <svg
              viewBox="0 0 164 182"
              className={styles.buzioIcone}
              aria-hidden="true"
            >
              <use href="#buzio-simbolo-1" width="100%" height="100%" />
            </svg>
          </motion.span>
        </motion.a>
      </header>

      <motion.section
        id="sobre-evento"
        className={styles.sobreEvento}
        initial="oculto"
        whileInView="visivel"
        viewport={{ once: true, margin: "-80px" }}
        variants={containerVariants}
      >
        <Divisor className={styles.sobreEventoDivisor} />
        <TexturaPapel className={styles.sobreEventoTextura} opacidade={0.05} />
        <div className={styles.sobreEventoConteudo}>
          <Marcador />
          <motion.div className={styles.conteudo} variants={containerVariants}>
            <Eyebrow>Apresentação</Eyebrow>
            <motion.h2
              className={styles.tituloSecundario}
              variants={itemVariants}
            >
              Sobre o evento
            </motion.h2>
            <motion.p className={styles.secaoTexto} variants={itemVariants}>
              O evento aborda a educação em perspectiva intercultural,
              decolonial e antirracista, reunindo diferentes sujeitos e
              epistemes em debates transdisciplinares, diálogos de saberes,
              vivências e intercâmbios de experiências. Com foco nas relações
              étnico-raciais, nos saberes e práticas educativas de povos e
              comunidades tradicionais, bem como em temas como justiça
              climática, bem viver, ações afirmativas, decolonização do
              conhecimento, justiça epistêmica e equidade de gênero,
              configura-se como um espaço de encontro, diálogo e criação
              coletiva.
            </motion.p>
            <motion.p className={styles.secaoTexto} variants={itemVariants}>
              Por meio de conferências, conversatórios, oficinas, narrativas
              multimodais, exposições e atividades culturais, o evento fortalece
              a cooperação acadêmica Sul-Sul e a construção compartilhada de
              conhecimentos, contribuindo para a qualificação da educação
              pública e para o desenvolvimento de práticas pedagógicas
              comprometidas com a justiça social, racial e climática.
            </motion.p>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        id="submissao"
        className={styles.secao}
        initial="oculto"
        whileInView="visivel"
        viewport={{ once: true, margin: "-80px" }}
        variants={containerVariants}
      >
        <Marcador />
        <motion.div className={styles.conteudo} variants={containerVariants}>
          <Eyebrow>Modalidades</Eyebrow>
          <motion.h2
            className={styles.tituloSecundario}
            variants={itemVariants}
          >
            Submissão
          </motion.h2>
          <motion.p className={styles.secaoTextoGrande} variants={itemVariants}>
            Compartilhe pesquisas, práticas e experiências nas modalidades desta
            edição.
          </motion.p>

          <motion.div
            className={styles.modalidadesGrade}
            variants={containerVariants}
          >
            {MODALIDADES_SUBMISSAO.map((modalidade) => (
              <motion.article
                key={modalidade.slug}
                className={styles.modalidadeCartao}
                variants={itemVariants}
              >
                <div className={styles.modalidadeCabecalho}>
                  <h3 className={styles.modalidadeNome}>{modalidade.nome}</h3>
                  {modalidade.subtitulo && (
                    <span className={styles.modalidadeSubtitulo}>
                      {modalidade.subtitulo}
                    </span>
                  )}
                </div>
                <p className={styles.modalidadePrazo}>
                  Prazo:{" "}
                  {formatarPeriodoSubmissao(
                    modalidade.prazoInicio,
                    modalidade.prazoFim,
                  )}
                </p>
                <p className={styles.modalidadeResumo}>
                  {modalidade.resumoCurto}
                </p>
                <button
                  type="button"
                  className={styles.modalidadeCtaPrimario}
                  disabled
                >
                  Realizar submissão
                </button>
                <Link
                  href={`/submissao/${modalidade.slug}`}
                  className={styles.modalidadeLink}
                >
                  {modalidade.linkRotulo} →
                </Link>
              </motion.article>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      <motion.section
        id="inscricoes"
        className={styles.secao}
        initial="oculto"
        whileInView="visivel"
        viewport={{ once: true, margin: "-80px" }}
        variants={containerVariants}
      >
        <Marcador />
        <motion.div className={styles.conteudo} variants={containerVariants}>
          <Eyebrow>Participe</Eyebrow>
          <motion.h2
            className={styles.tituloSecundario}
            variants={itemVariants}
          >
            Inscrições
          </motion.h2>
          <motion.p className={styles.secaoTextoGrande} variants={itemVariants}>
            Um espaço de encontro entre pesquisadoras, pesquisadores, docentes,
            estudantes e comunidade para pensar educação a partir de outras
            epistemologias.
          </motion.p>
          <motion.div className={styles.ctaWrapper} variants={itemVariants}>
            <Link href="/cadastro" className={styles.cta}>
              <Carimbo className={styles.ctaCarimbo} preenchido />
              <span>Inscreva-se</span>
            </Link>
          </motion.div>
          <motion.p className={styles.notaRodape} variants={itemVariants}>
            Participantes credenciados recebem certificado de participação
            emitido pela organização do evento.
          </motion.p>
        </motion.div>
      </motion.section>

      <motion.section
        id="programacao"
        className={styles.secao}
        initial="oculto"
        whileInView="visivel"
        viewport={{ once: true, margin: "-80px" }}
        variants={containerVariants}
      >
        <Marcador />
        <motion.div className={styles.conteudo} variants={containerVariants}>
          <Eyebrow>Agenda</Eyebrow>
          <motion.h2
            className={styles.tituloSecundario}
            variants={itemVariants}
          >
            Programação
          </motion.h2>
          <motion.p className={styles.secaoTexto} variants={itemVariants}>
            Mesas, oficinas e rodas de conversa ao longo de toda a edição — em
            breve com inscrições por atividade.
          </motion.p>
        </motion.div>
      </motion.section>

      <motion.section
        id="anais"
        className={styles.secao}
        initial="oculto"
        whileInView="visivel"
        viewport={{ once: true, margin: "-80px" }}
        variants={containerVariants}
      >
        <Marcador />
        <motion.div className={styles.conteudo} variants={containerVariants}>
          <Eyebrow>Publicações</Eyebrow>
          <motion.div className={styles.tituloLinha} variants={itemVariants}>
            <h2 className={styles.tituloSecundario}>Anais e Memória</h2>
            <SeloEmBreve />
          </motion.div>
          <motion.p className={styles.secaoTexto} variants={itemVariants}>
            Em breve abriremos a chamada para submissão de trabalhos desta
            edição. Os anais das edições anteriores serão disponibilizados aqui
            assim que organizados.
          </motion.p>
        </motion.div>
      </motion.section>

      <section className={styles.realizadores} aria-label="Realização">
        <div className={styles.realizadoresConteudo}>
          <span className={styles.realizadoresLabel}>Realização</span>
          <img
            src="/gpdes-realizacao.png"
            alt="GPDES/UnB — Grupo de Pesquisa Educação, Saberes e Decolonialidades, e Universidade de Brasília"
            className={styles.realizadoresLogo}
          />
        </div>
      </section>
    </>
  );
}
