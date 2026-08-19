import { notFound } from "next/navigation";
import Divisor from "@/components/graficos/Divisor";
import { buscarModalidadeSubmissaoPublicaPorSlug, dividirParagrafos } from "@/lib/publico";
import styles from "./page.module.scss";

async function buscarModalidadeEArea(modalidadeSlug, areaSlug) {
  const modalidade = await buscarModalidadeSubmissaoPublicaPorSlug(modalidadeSlug);
  if (!modalidade) return { modalidade: null, area: null, indice: -1 };

  const indice = modalidade.areas.findIndex((item) => item.slug === areaSlug);
  return { modalidade, area: indice === -1 ? null : modalidade.areas[indice], indice };
}

export async function generateMetadata({ params }) {
  const { modalidade, area } = await buscarModalidadeEArea(params.modalidade, params.area);
  return {
    title: area ? `${area.titulo} — ${modalidade.nome}` : "Área temática não encontrada",
  };
}

export default async function PaginaAreaTematicaSubmissao({ params }) {
  const { modalidade, area, indice } = await buscarModalidadeEArea(params.modalidade, params.area);
  if (!modalidade || !area) notFound();

  const coordenacao = area.pessoas.filter((pessoa) => pessoa.papel === "COORDENACAO");
  const convidados = area.pessoas.filter((pessoa) => pessoa.papel === "CONVIDADO");
  const descricao = dividirParagrafos(area.descricao);

  return (
    <article className={styles.pagina}>
      <header className={styles.cabecalho}>
        <span className={styles.eyebrow}>
          {modalidade.nome} · {modalidade.rotuloItem} {indice + 1}
        </span>
        <h1 className={`${styles.titulo} stencil`}>{area.titulo}</h1>
      </header>

      <Divisor className={styles.divisor} />

      {coordenacao.length > 0 && (
        <section className={styles.secaoTexto}>
          <h2 className={styles.subtituloSecao}>Coordenação</h2>
          <ul className={styles.coordenacaoLista}>
            {coordenacao.map((pessoa) => (
              <li key={pessoa.id} className={styles.coordenadorItem}>
                <span className={styles.coordenadorNome}>{pessoa.nome}</span>
                {pessoa.afiliacao && (
                  <span className={styles.coordenadorAfiliacao}>{pessoa.afiliacao}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {convidados.length > 0 && (
        <section className={styles.secaoTexto}>
          <h2 className={styles.subtituloSecao}>Convidadas e convidados especiais</h2>
          <ul className={styles.convidadosGrade}>
            {convidados.map((pessoa) => (
              <li key={pessoa.id} className={styles.convidadoCartao}>
                <div className={styles.convidadoFoto} aria-hidden="true">
                  <span className={styles.convidadoInicial}>
                    {pessoa.nome.trim().charAt(0)}
                  </span>
                </div>
                <p className={styles.convidadoNome}>{pessoa.nome}</p>
                {pessoa.afiliacao && (
                  <p className={styles.convidadoAfiliacao}>{pessoa.afiliacao}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {descricao.length > 0 && (
        <section className={styles.secaoTexto}>
          <h2 className={styles.subtituloSecao}>Descrição</h2>
          {descricao.map((paragrafo) => (
            <p key={paragrafo.slice(0, 24)}>{paragrafo}</p>
          ))}
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
