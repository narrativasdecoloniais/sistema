import { notFound } from "next/navigation";
import Divisor from "@/components/graficos/Divisor";
import { buscarModalidadeSubmissao } from "@/lib/modalidadesSubmissao";
import {
  AREAS_TEMATICAS_CONVERSATORIOS,
  buscarAreaTematicaConversatorio,
  dividirCoordenador,
} from "@/lib/areasTematicasConversatorios";
import styles from "./page.module.scss";

export function generateStaticParams() {
  return AREAS_TEMATICAS_CONVERSATORIOS.map((area) => ({
    modalidade: "conversatorios",
    area: area.slug,
  }));
}

export function generateMetadata({ params }) {
  const area = buscarAreaTematicaConversatorio(params.area);
  return {
    title: area ? `${area.titulo} — Conversatórios` : "Área temática não encontrada",
  };
}

export default function PaginaAreaTematicaSubmissao({ params }) {
  const modalidade = buscarModalidadeSubmissao(params.modalidade);
  if (!modalidade) notFound();

  const area = buscarAreaTematicaConversatorio(params.area);
  if (!area) notFound();

  return (
    <article className={styles.pagina}>
      <header className={styles.cabecalho}>
        <span className={styles.eyebrow}>
          {modalidade.nome} · Conversatório {area.numero}
        </span>
        <h1 className={`${styles.titulo} stencil`}>{area.titulo}</h1>
      </header>

      <Divisor className={styles.divisor} />

      <section className={styles.secaoTexto}>
        <h2 className={styles.subtituloSecao}>Coordenação</h2>
        <ul className={styles.coordenacaoLista}>
          {area.coordenacao.map((pessoa) => {
            const { nome, afiliacao } = dividirCoordenador(pessoa);
            return (
              <li key={pessoa} className={styles.coordenadorItem}>
                <span className={styles.coordenadorNome}>{nome}</span>
                {afiliacao && (
                  <span className={styles.coordenadorAfiliacao}>{afiliacao}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {area.convidados.length > 0 && (
        <section className={styles.secaoTexto}>
          <h2 className={styles.subtituloSecao}>Convidadas e convidados especiais</h2>
          <ul className={styles.convidadosGrade}>
            {area.convidados.map((convidado) => (
              <li key={convidado.nome} className={styles.convidadoCartao}>
                <div className={styles.convidadoFoto} aria-hidden="true">
                  <span className={styles.convidadoInicial}>
                    {convidado.nome.trim().charAt(0)}
                  </span>
                </div>
                <p className={styles.convidadoNome}>{convidado.nome}</p>
                <p className={styles.convidadoAfiliacao}>{convidado.afiliacao}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.secaoTexto}>
        <h2 className={styles.subtituloSecao}>Descrição</h2>
        {area.descricao.map((paragrafo) => (
          <p key={paragrafo.slice(0, 24)}>{paragrafo}</p>
        ))}
      </section>

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
