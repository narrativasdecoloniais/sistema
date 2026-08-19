import Link from "next/link";
import { notFound } from "next/navigation";
import Divisor from "@/components/graficos/Divisor";
import {
  buscarModalidadeSubmissaoPublicaPorSlug,
  formatarPeriodoSubmissao,
  dividirParagrafos,
} from "@/lib/publico";
import styles from "./page.module.scss";

export async function generateMetadata({ params }) {
  const modalidade = await buscarModalidadeSubmissaoPublicaPorSlug(params.modalidade);
  return {
    title: modalidade ? `${modalidade.nome} — Submissão` : "Modalidade não encontrada",
  };
}

export default async function PaginaModalidadeSubmissao({ params }) {
  const modalidade = await buscarModalidadeSubmissaoPublicaPorSlug(params.modalidade);
  if (!modalidade) notFound();

  const descricao = dividirParagrafos(modalidade.descricao);

  return (
    <article className={styles.pagina}>
      <header className={styles.cabecalho}>
        <span className={styles.eyebrow}>Submissão</span>
        <h1 className={`${styles.titulo} stencil`}>{modalidade.nome}</h1>
        {modalidade.subtitulo && (
          <p className={styles.subtitulo}>{modalidade.subtitulo}</p>
        )}
        <p className={styles.prazo}>
          Prazo de submissão:{" "}
          {formatarPeriodoSubmissao(modalidade.prazoInicio, modalidade.prazoFim)}
        </p>
      </header>

      <Divisor className={styles.divisor} />

      {descricao.length > 0 && (
        <section className={styles.secaoTexto}>
          <h2 className={styles.subtituloSecao}>{modalidade.perguntaTitulo}</h2>
          {descricao.map((paragrafo) => (
            <p key={paragrafo.slice(0, 24)}>{paragrafo}</p>
          ))}
        </section>
      )}

      {modalidade.areas.length > 0 && (
        <section className={styles.secaoTexto}>
          <h2 className={styles.subtituloSecao}>Áreas temáticas</h2>
          <p className={styles.areasIntro}>
            Cada {modalidade.rotuloItem} reúne uma coordenação e convidadas/os
            especiais em torno de um eixo temático. Selecione um deles para
            ver a descrição completa.
          </p>
          <ul className={styles.areasGrade}>
            {modalidade.areas.map((area, indice) => (
              <li key={area.slug}>
                <Link
                  href={`/submissao/${modalidade.slug}/${area.slug}`}
                  className={styles.areaCartao}
                >
                  <span className={styles.areaTexto}>
                    <span className={styles.areaEyebrow}>
                      {modalidade.rotuloItem} {indice + 1}
                    </span>
                    <span className={styles.areaTitulo}>{area.titulo}</span>
                  </span>
                  <span className={styles.areaSeta} aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className={styles.notaDocumentos}>
        As regras completas de submissão e o modelo (template) desta
        modalidade serão disponibilizados aqui assim que publicados.
      </p>

      <div className={styles.acoes}>
        <button type="button" className={styles.cta} disabled>
          Realizar submissão
        </button>
      </div>
    </article>
  );
}
