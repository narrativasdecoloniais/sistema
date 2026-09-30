import { Suspense } from "react";
import { notFound } from "next/navigation";
import Divisor from "@/components/graficos/Divisor";
import ConteudoRichText from "@/components/ConteudoRichText";
import DefinirEdicaoExibida from "@/components/publico/DefinirEdicaoExibida";
import AnaisEdicao from "@/components/publico/anais/AnaisEdicao";
import { buscarAnaisDaEdicao } from "@/lib/anaisServidor";
import { LICENCAS_ANAIS, linhaIdentificadores, URL_SITE } from "@/lib/anais";
import { buscarEdicaoPorSlug, montarPropsNavegacao } from "@/lib/publico";
import styles from "../anais.module.scss";

export async function generateMetadata({ params }) {
  const dados = await buscarAnaisDaEdicao(params.edicao);
  if (!dados) return { title: "Anais não encontrados" };
  const { anais, edicao, artigos } = dados;
  const descricao = `${edicao.nome}: ${artigos.length} ${artigos.length === 1 ? "trabalho publicado" : "trabalhos publicados"}${
    anais.issn ? ` · ISSN ${anais.issn}` : ""
  }${anais.isbn ? ` · ISBN ${anais.isbn}` : ""}.`;
  return {
    title: anais.titulo,
    description: descricao,
    alternates: { canonical: `/anais/${params.edicao}` },
    openGraph: {
      type: "website",
      title: anais.titulo,
      description: descricao,
      url: `/anais/${params.edicao}`,
      siteName: "Narrativas — GPDES/UnB",
      locale: "pt_BR",
    },
  };
}

function dadosEstruturados(dados, slug) {
  const { anais, edicao } = dados;
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: anais.titulo,
    alternativeHeadline: anais.subtitulo || undefined,
    url: `${URL_SITE}/anais/${slug}`,
    issn: anais.issn || undefined,
    isbn: anais.isbn || undefined,
    inLanguage: "pt-BR",
    datePublished: anais.publicadoEm,
    publisher: anais.editora ? { "@type": "Organization", name: anais.editora } : undefined,
    editor: anais.organizadores?.length ? anais.organizadores.map((nome) => ({ "@type": "Person", name: nome })) : undefined,
    license: LICENCAS_ANAIS[anais.licenca]?.url || undefined,
    about: { "@type": "Event", name: edicao.nome },
  };
}

function jsonLd(objeto) {
  return JSON.stringify(objeto).replace(/</g, "\\u003c");
}

export default async function PaginaAnaisDaEdicao({ params }) {
  const [dados, edicaoCompleta] = await Promise.all([
    buscarAnaisDaEdicao(params.edicao),
    buscarEdicaoPorSlug(params.edicao),
  ]);
  if (!dados) notFound();

  const { anais, edicao, artigos } = dados;
  const licenca = LICENCAS_ANAIS[anais.licenca];
  const identificadores = linhaIdentificadores(anais);

  return (
    <article className={styles.pagina}>
      <DefinirEdicaoExibida numero={edicao.numero} navegacao={montarPropsNavegacao(edicaoCompleta)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(dadosEstruturados(dados, params.edicao)) }} />

      <header className={styles.cabecalho}>
        <span className={styles.eyebrow}>{edicao.nome}</span>
        <h1 className={`${styles.titulo} stencil`}>Anais</h1>
        <p className={styles.tituloAnais}>{anais.titulo}</p>
        {anais.subtitulo && <p className={styles.subtitulo}>{anais.subtitulo}</p>}
        <dl className={styles.ficha}>
          {identificadores && (
            <div>
              <dt>Registro</dt>
              <dd>{identificadores}</dd>
            </div>
          )}
          {anais.organizadores?.length > 0 && (
            <div>
              <dt>Organização</dt>
              <dd>{anais.organizadores.join(", ")}</dd>
            </div>
          )}
          {(anais.editora || anais.localPublicacao || anais.anoPublicacao) && (
            <div>
              <dt>Publicação</dt>
              <dd>{[anais.localPublicacao, anais.editora, anais.anoPublicacao].filter(Boolean).join(" · ")}</dd>
            </div>
          )}
          {licenca && (
            <div>
              <dt>Licença</dt>
              <dd>
                {licenca.url ? (
                  <a href={licenca.url} target="_blank" rel="noopener noreferrer license">
                    {licenca.sigla}
                  </a>
                ) : (
                  licenca.sigla
                )}
              </dd>
            </div>
          )}
        </dl>
        {anais.pdfUrl && (
          <a href={anais.pdfUrl} className={styles.botaoPrimario} download>
            Baixar os Anais completos (PDF)
          </a>
        )}
      </header>

      {anais.apresentacao && (
        <details className={styles.apresentacao}>
          <summary>Apresentação</summary>
          <ConteudoRichText html={anais.apresentacao} tipo="edital" className={styles.textoRico} sanitizadoNoServidor />
        </details>
      )}

      <Divisor className={styles.divisor} />

      <Suspense fallback={<p className={styles.aviso}>Carregando os trabalhos…</p>}>
        <AnaisEdicao artigos={artigos} edicaoSlug={params.edicao} />
      </Suspense>
    </article>
  );
}
