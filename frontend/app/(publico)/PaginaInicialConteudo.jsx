"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import Logo, { LOGO_DURACAO_ENTRADA } from "@/components/publico/Logo";
import Carimbo from "@/components/graficos/Carimbo";
import Divisor from "@/components/graficos/Divisor";
import TexturaPapel from "@/components/graficos/TexturaPapel";
import NavegacaoDias, { idAbaDia, idPainelDia } from "@/components/inscricao/NavegacaoDias";
import CarrosselAtividades from "@/components/inscricao/CarrosselAtividades";
import LinhaProgramacao from "@/components/publico/LinhaProgramacao";
import CardAtividadeProgramacao from "@/components/publico/CardAtividadeProgramacao";
import { agruparAtividadesPorDia } from "@/lib/inscricao";
import {
  formatarDiaAtividade,
  formatarHoraCurta,
  agruparAtividadesPorHorarioInicio,
} from "@/lib/publico";
import {
  MODALIDADES_SUBMISSAO,
  formatarPeriodoSubmissao,
} from "@/lib/modalidadesSubmissao";
import styles from "./page.module.scss";

// TODO: substituir pela URL real assim que confirmada.
const URL_GPDES = "#";

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

export default function PaginaInicialConteudo({
  atividades,
  realizadores = [],
  corFundoRealizadores = "BARRO",
  logoSvg,
  logoSvgViewBox,
  logoSvgCores,
  corFundoHero = "PAPEL",
  opacidadeFundoHero = 100,
  fundoHeroTipo = "COR",
  imagemFundoHeroDesktop,
  imagemFundoHeroMobile,
  corTextoHero = "TINTA",
  corBuzioHero = "BUZIO",
  faixaHeroTipoDesktop = "COR",
  corFaixaHeroDesktop = "OCRE",
  imagemFaixaHeroDesktop,
  faixaHeroTipoMobile = "COR",
  corFaixaHeroMobile = "OCRE",
  imagemFaixaHeroMobile,
  temEdicaoAtual = false,
  edicaoSlug,
  dataEvento = "Data a confirmar",
  localEvento,
  realizacaoEvento = "Realização: GPDES/UnB",
}) {
  const reduzMovimento = useReducedMotion();

  const idDiasProgramacao = useId();
  const diasProgramacao = useMemo(() => agruparAtividadesPorDia(atividades), [atividades]);
  const [diaProgramacaoSelecionado, setDiaProgramacaoSelecionado] = useState(null);
  const chaveDiaProgramacaoAtiva =
    diaProgramacaoSelecionado && diasProgramacao.some((dia) => dia.chave === diaProgramacaoSelecionado)
      ? diaProgramacaoSelecionado
      : (diasProgramacao[0]?.chave ?? null);
  const diaProgramacaoAtual =
    diasProgramacao.find((dia) => dia.chave === chaveDiaProgramacaoAtiva) ?? null;

  function renderizarCartaoProgramacao(atividade) {
    return (
      <CardAtividadeProgramacao
        key={atividade.id}
        atividade={atividade}
        temEdicaoAtual={temEdicaoAtual}
        edicaoSlug={edicaoSlug}
      />
    );
  }

  const estiloHero = {
    "--opacidade-fundo-hero": `${opacidadeFundoHero}%`,
    ...(imagemFundoHeroDesktop ? { "--imagem-fundo-hero-desktop": `url(${imagemFundoHeroDesktop})` } : {}),
    ...(imagemFundoHeroMobile ? { "--imagem-fundo-hero-mobile": `url(${imagemFundoHeroMobile})` } : {}),
    ...(imagemFaixaHeroDesktop ? { "--imagem-faixa-hero-desktop": `url(${imagemFaixaHeroDesktop})` } : {}),
    ...(imagemFaixaHeroMobile ? { "--imagem-faixa-hero-mobile": `url(${imagemFaixaHeroMobile})` } : {}),
  };

  return (
    <>
      <header
        id="hero-landing"
        className={styles.hero}
        data-cor-fundo={corFundoHero}
        data-fundo-tipo={fundoHeroTipo}
        data-cor-texto={corTextoHero}
        data-cor-buzio={corBuzioHero}
        data-cor-faixa-desktop={corFaixaHeroDesktop}
        data-cor-faixa-mobile={corFaixaHeroMobile}
        data-faixa-tipo-desktop={faixaHeroTipoDesktop}
        data-faixa-tipo-mobile={faixaHeroTipoMobile}
        style={estiloHero}
      >
        {fundoHeroTipo === "IMAGEM" && <div className={styles.heroFundoBlur} aria-hidden="true" />}
        <span className={`${styles.heroFaixa} ${styles.heroFaixaEsquerda}`} aria-hidden="true" />
        <span className={`${styles.heroFaixa} ${styles.heroFaixaDireita}`} aria-hidden="true" />

        <div className={styles.logoWrapper}>
          <Logo
            tamanho="grande"
            logoSvg={logoSvg}
            logoSvgViewBox={logoSvgViewBox}
            logoSvgCores={logoSvgCores}
          />
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
          <span className={styles.legendaPrincipal}>{dataEvento}</span>
          {localEvento && (
            <span className={`${styles.legendaPrincipal} ${styles.legendaLocal}`}>{localEvento}</span>
          )}
          <span className={styles.legendaSecundaria}>{realizacaoEvento}</span>
        </motion.p>

        <motion.a
          href="#sobre-evento"
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
          <span className={`${styles.conviteTexto} stencil`}>Deslize para ver mais</span>
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
            {temEdicaoAtual && (
              <motion.div className={styles.sobreEventoCtas} variants={itemVariants}>
                <Link href="/inscricao" className={styles.inscricaoCta}>
                  Inscreva-se →
                </Link>
                <a
                  href={URL_GPDES}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.gpdesCta}
                >
                  Conheça o GPDES
                </a>
              </motion.div>
            )}
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
          <motion.p className={styles.secaoTextoGrande} variants={itemVariants}>
            Mesas, oficinas e rodas de conversa ao longo de toda a edição.
          </motion.p>

          {diasProgramacao.length === 0 ? (
            <motion.p className={styles.secaoTexto} variants={itemVariants}>
              A programação desta edição está sendo organizada — as atividades
              aparecerão aqui assim que publicadas.
            </motion.p>
          ) : (
            <motion.div className={styles.programacaoBloco} variants={itemVariants}>
              {diasProgramacao.length > 1 ? (
                <NavegacaoDias
                  dias={diasProgramacao}
                  chaveAtiva={chaveDiaProgramacaoAtiva}
                  onSelecionar={setDiaProgramacaoSelecionado}
                  idBase={idDiasProgramacao}
                />
              ) : (
                diaProgramacaoAtual && (
                  <p className={styles.programacaoDiaUnico}>
                    {formatarDiaAtividade(diaProgramacaoAtual.inicioIso).completo}
                  </p>
                )
              )}

              {diaProgramacaoAtual && (
                <div
                  className={styles.programacaoTimeline}
                  {...(diasProgramacao.length > 1
                    ? {
                        role: "tabpanel",
                        id: idPainelDia(idDiasProgramacao, diaProgramacaoAtual.chave),
                        "aria-labelledby": idAbaDia(idDiasProgramacao, diaProgramacaoAtual.chave),
                      }
                    : {})}
                >
                  {agruparAtividadesPorHorarioInicio(diaProgramacaoAtual.atividades).map((grupo) => (
                    <LinhaProgramacao
                      key={grupo.inicioIso}
                      hora={formatarHoraCurta(grupo.inicioIso)}
                    >
                      {grupo.atividades.length === 1 ? (
                        renderizarCartaoProgramacao(grupo.atividades[0])
                      ) : (
                        <CarrosselAtividades
                          rotulo={`${grupo.atividades.length} atividades às ${formatarHoraCurta(grupo.inicioIso)}`}
                          estiloSlide={{ "--largura-slide": "78%", "--largura-slide-desktop": "55%" }}
                        >
                          {grupo.atividades.map(renderizarCartaoProgramacao)}
                        </CarrosselAtividades>
                      )}
                    </LinhaProgramacao>
                  ))}
                </div>
              )}
            </motion.div>
          )}
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

      {realizadores.length > 0 && (
        <section className={styles.realizadores} data-cor={corFundoRealizadores} aria-label="Realização">
          <div className={styles.realizadoresConteudo}>
            <span className={styles.realizadoresLabel}>Realização</span>
            <div className={styles.realizadoresGrade}>
              {realizadores.map((realizador) =>
                realizador.link ? (
                  <a
                    key={realizador.id}
                    href={realizador.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.realizadorItem}
                  >
                    <img src={realizador.imagem} alt={realizador.nome} className={styles.realizadorLogo} />
                  </a>
                ) : (
                  <div key={realizador.id} className={styles.realizadorItem}>
                    <img src={realizador.imagem} alt={realizador.nome} className={styles.realizadorLogo} />
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
