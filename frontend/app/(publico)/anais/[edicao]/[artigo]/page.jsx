import Link from "next/link";
import { notFound } from "next/navigation";
import DefinirEdicaoExibida from "@/components/publico/DefinirEdicaoExibida";
import ArtigoAnais from "@/components/publico/anais/ArtigoAnais";
import ComentariosArtigo from "@/components/publico/anais/ComentariosArtigo";
import ContadorVisualizacao from "@/components/publico/anais/ContadorVisualizacao";
import { obterUsuarioAtual } from "@/lib/auth";
import { buscarArtigoDosAnais } from "@/lib/anaisServidor";
import { LICENCAS_ANAIS, URL_SITE, urlPdfArtigo } from "@/lib/anais";
import { buscarEdicaoPorSlug, montarPropsNavegacao } from "@/lib/publico";
import styles from "../../anais.module.scss";

function dataIso(iso) {
  return iso ? new Date(iso).toISOString().slice(0, 10) : undefined;
}

function dataScholar(iso) {
  return iso ? dataIso(iso).replace(/-/g, "/") : undefined;
}

// Metadados no padrão Highwire Press, lido pelo Google Acadêmico.
function metaAcademica(dados, caminho) {
  const { artigo, anais, edicao } = dados;
  const meta = {
    citation_title: artigo.titulo,
    citation_author: artigo.autores.map((autor) => autor.nome),
    citation_publication_date: dataScholar(anais.publicadoEm),
    citation_online_date: dataScholar(artigo.publicadoEm),
    citation_conference_title: edicao.nome,
    citation_inbook_title: anais.titulo,
    citation_publisher: anais.editora || undefined,
    citation_language: "pt",
    citation_abstract_html_url: `${URL_SITE}${caminho}`,
    citation_pdf_url: urlPdfArtigo(edicao.slug, artigo.slug),
    citation_firstpage: artigo.paginaInicial ? String(artigo.paginaInicial) : undefined,
    citation_lastpage: artigo.paginaFinal ? String(artigo.paginaFinal) : undefined,
    citation_issn: anais.issn || undefined,
    citation_isbn: anais.isbn || undefined,
  };
  return Object.fromEntries(Object.entries(meta).filter(([, valor]) => valor !== undefined && valor !== ""));
}

export async function generateMetadata({ params }) {
  const dados = await buscarArtigoDosAnais(params.edicao, params.artigo);
  if (!dados) return { title: "Trabalho não encontrado" };
  const { artigo, anais } = dados;
  const caminho = `/anais/${params.edicao}/${params.artigo}`;
  const autores = artigo.autores.map((autor) => autor.nome);
  return {
    title: `${artigo.titulo} — ${anais.titulo}`,
    description: artigo.descricao,
    authors: autores.map((nome) => ({ name: nome })),
    alternates: { canonical: caminho },
    openGraph: {
      type: "article",
      title: artigo.titulo,
      description: artigo.descricao,
      url: caminho,
      siteName: "Narrativas — GPDES/UnB",
      locale: "pt_BR",
      publishedTime: artigo.publicadoEm,
      modifiedTime: artigo.atualizadoEm,
      authors: autores,
      section: artigo.modalidade?.nome,
    },
    twitter: { card: "summary", title: artigo.titulo, description: artigo.descricao },
    other: metaAcademica(dados, caminho),
  };
}

function dadosEstruturados(dados, caminho) {
  const { artigo, anais, edicao } = dados;
  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: artigo.titulo.slice(0, 110),
    name: artigo.titulo,
    description: artigo.descricao,
    url: `${URL_SITE}${caminho}`,
    inLanguage: "pt-BR",
    datePublished: dataIso(artigo.publicadoEm),
    dateModified: dataIso(artigo.atualizadoEm),
    author: artigo.autores.map((autor) => ({
      "@type": "Person",
      name: autor.nome,
      ...(autor.orcid ? { sameAs: `https://orcid.org/${autor.orcid.replace(/^https?:\/\/orcid\.org\//i, "")}` } : {}),
    })),
    isPartOf: {
      "@type": "Book",
      name: anais.titulo,
      issn: anais.issn || undefined,
      isbn: anais.isbn || undefined,
      publisher: anais.editora ? { "@type": "Organization", name: anais.editora } : undefined,
      url: `${URL_SITE}/anais/${edicao.slug}`,
    },
    pageStart: artigo.paginaInicial || undefined,
    pageEnd: artigo.paginaFinal || undefined,
    license: LICENCAS_ANAIS[anais.licenca]?.url || undefined,
    about: artigo.area?.titulo || undefined,
    genre: artigo.modalidade?.nome,
    encoding: { "@type": "MediaObject", encodingFormat: "application/pdf", contentUrl: urlPdfArtigo(edicao.slug, artigo.slug) },
  };
}

function jsonLd(objeto) {
  return JSON.stringify(objeto).replace(/</g, "\\u003c");
}

export default async function PaginaArtigoDosAnais({ params }) {
  const [dados, edicaoCompleta, usuario] = await Promise.all([
    buscarArtigoDosAnais(params.edicao, params.artigo),
    buscarEdicaoPorSlug(params.edicao),
    obterUsuarioAtual(),
  ]);
  if (!dados) notFound();

  const { artigo, anais, edicao, anterior, proximo, relacionados } = dados;
  const caminho = `/anais/${params.edicao}/${params.artigo}`;

  return (
    <article className={`${styles.pagina} ${styles.paginaArtigo}`}>
      <DefinirEdicaoExibida numero={edicao.numero} navegacao={montarPropsNavegacao(edicaoCompleta)} />
      <ContadorVisualizacao artigoId={artigo.id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(dadosEstruturados(dados, caminho)) }} />

      <ArtigoAnais artigo={artigo} anais={anais} edicao={edicao} />

      {(anterior || proximo) && (
        <nav className={styles.navegacaoArtigos} aria-label="Outros trabalhos destes Anais">
          {anterior ? (
            <Link href={`/anais/${edicao.slug}/${anterior.slug}`} className={styles.vizinho} rel="prev">
              <span className={styles.vizinhoRotulo}>← Anterior</span>
              <span className={styles.vizinhoTitulo}>{anterior.titulo}</span>
            </Link>
          ) : (
            <span />
          )}
          {proximo && (
            <Link href={`/anais/${edicao.slug}/${proximo.slug}`} className={`${styles.vizinho} ${styles.vizinhoProximo}`} rel="next">
              <span className={styles.vizinhoRotulo}>Próximo →</span>
              <span className={styles.vizinhoTitulo}>{proximo.titulo}</span>
            </Link>
          )}
        </nav>
      )}

      {relacionados.length > 0 && (
        <section className={styles.relacionados} aria-labelledby="titulo-relacionados">
          <h2 id="titulo-relacionados" className={styles.rotuloSecao}>
            Da mesma área
          </h2>
          <ul>
            {relacionados.map((item) => (
              <li key={item.slug}>
                <Link href={`/anais/${edicao.slug}/${item.slug}`}>{item.titulo}</Link>
                <span>{item.autores.join("; ")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ComentariosArtigo
        artigoId={artigo.id}
        usuario={usuario ? { id: usuario.id, nome: usuario.nome } : null}
        caminho={caminho}
      />
    </article>
  );
}
