import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Divisor from "@/components/graficos/Divisor";
import {
  buscarModalidadeSubmissaoPublicaPorSlug,
  dividirParagrafos,
  formatarPeriodoAtividade,
  prazoSubmissaoAberto,
} from "@/lib/publico";
import styles from "./page.module.scss";

async function buscarModalidadeEArea(modalidadeSlug, areaSlug) {
  const modalidade =
    await buscarModalidadeSubmissaoPublicaPorSlug(modalidadeSlug);
  if (!modalidade) return { modalidade: null, area: null, indice: -1 };

  const indice = modalidade.areas.findIndex((item) => item.slug === areaSlug);
  return {
    modalidade,
    area: indice === -1 ? null : modalidade.areas[indice],
    indice,
  };
}

export async function generateMetadata({ params }) {
  const { modalidade, area } = await buscarModalidadeEArea(
    params.modalidade,
    params.area,
  );
  return {
    title: area
      ? `${area.titulo} — ${modalidade.nome}`
      : "Área temática não encontrada",
  };
}

export default async function PaginaAreaTematicaSubmissao({ params }) {
  const { modalidade, area, indice } = await buscarModalidadeEArea(
    params.modalidade,
    params.area,
  );
  if (!modalidade || !area) notFound();

  // Área com exatamente uma atividade vinculada não precisa de página
  // própria — manda direto pra página da atividade em vez de mostrar uma
  // "lista" de um item só (com 0 ou 2+ atividades a página da área segue
  // normal, com descrição e CTA de submissão).
  if (area.atividades && area.atividades.length === 1) {
    redirect(`/atividades/${area.atividades[0].slug}`);
  }

  const prazoAberto = prazoSubmissaoAberto(modalidade.prazoInicio, modalidade.prazoFim);

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

      {descricao.length > 0 && (
        <section className={styles.secaoTexto}>
          <h2 className={styles.subtituloSecao}>Descrição</h2>
          {descricao.map((paragrafo) => (
            <p key={paragrafo.slice(0, 24)}>{paragrafo}</p>
          ))}
        </section>
      )}

      {area.atividades && area.atividades.length > 0 && (
        <section className={styles.secaoTexto}>
          <h2 className={styles.subtituloSecao}>Atividades relacionadas</h2>
          <ul className={styles.atividadesLista}>
            {area.atividades.map((atividade) => (
              <li key={atividade.id} className={styles.atividadeItem}>
                <Link
                  href={`/atividades/${atividade.slug}`}
                  className={styles.atividadeNome}
                >
                  {atividade.nome}
                </Link>
                <span className={styles.atividadeMeta}>
                  {[
                    atividade.tipoAtividade?.nome,
                    atividade.local,
                    formatarPeriodoAtividade(
                      atividade.inicioAtividade,
                      atividade.fimAtividade,
                    ),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className={styles.notaDocumentos}>
        As regras completas de submissão e o modelo (template) desta modalidade
        serão disponibilizados aqui assim que publicados.
      </p>

      <div className={styles.acoes}>
        <Link
          href={`/submissao/${modalidade.slug}/enviar?area=${area.slug}`}
          className={`${styles.cta} ${prazoAberto ? "" : styles.ctaDesabilitado}`}
          aria-disabled={!prazoAberto}
        >
          {prazoAberto ? "Realizar submissão" : "Prazo encerrado"}
        </Link>
      </div>
    </article>
  );
}
