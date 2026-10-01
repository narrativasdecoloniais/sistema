import Link from "next/link";
import ConteudoRichText from "@/components/ConteudoRichText";
import PainelCitacao from "@/components/publico/anais/PainelCitacao";
import { LICENCAS_ANAIS, formatarDataPublicacao, linhaIdentificadores, rotuloPaginas, urlPdfArtigo } from "@/lib/anais";
import { formatarPeriodoEdicao } from "@/lib/publico";
import styles from "@/app/(publico)/anais/anais.module.scss";

// Corpo da página do trabalho nos Anais (trilha, cabeçalho, ações, resumo,
// referências e ficha) — o mesmo na página pública e na prévia de Minhas
// submissões. Na prévia (`previa`) os Anais podem nem estar publicados:
// sem links para a edição/filtro de autor e sem PDF.
export default function ArtigoAnais({ artigo, anais, edicao, previa = false }) {
  const licenca = LICENCAS_ANAIS[anais.licenca];
  const paginas = rotuloPaginas(artigo.paginaInicial, artigo.paginaFinal);
  const identificadores = linhaIdentificadores(anais);
  const eyebrow = [artigo.modalidade?.nome, artigo.area?.titulo].filter(Boolean).join(" · ");
  const linkAnais = previa ? null : `/anais/${edicao.slug}`;

  return (
    <>
      <nav aria-label="Você está em" className={styles.trilha}>
        <ol>
          <li>{previa ? "Anais" : <Link href="/anais">Anais</Link>}</li>
          <li>{linkAnais ? <Link href={linkAnais}>{anais.titulo}</Link> : anais.titulo}</li>
          <li aria-current="page">Trabalho</li>
        </ol>
      </nav>

      <header className={styles.cabecalhoArtigo}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h1 className={styles.tituloArtigo}>{artigo.titulo}</h1>
        <ul className={styles.autores} aria-label="Autores">
          {artigo.autores.map((autor, indice) => (
            <li key={`${autor.nome}-${indice}`}>
              {linkAnais ? (
                <Link href={`${linkAnais}?autor=${encodeURIComponent(autor.nome)}`} className={styles.autorNome}>
                  {autor.nome}
                </Link>
              ) : (
                <span className={styles.autorNome}>{autor.nome}</span>
              )}
              {autor.orcid && (
                <a
                  href={`https://orcid.org/${autor.orcid.replace(/^https?:\/\/orcid\.org\//i, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.orcid}
                >
                  ORCID
                </a>
              )}
            </li>
          ))}
        </ul>
      </header>

      <div className={styles.acoesArtigo}>
        {!previa && (
          <a href={urlPdfArtigo(edicao.slug, artigo.slug)} className={styles.botaoPrimario} rel="nofollow">
            Baixar PDF
          </a>
        )}
        <PainelCitacao citacao={artigo.citacao} slug={artigo.slug || "trabalho"} />
      </div>

      <section className={styles.secaoTexto} aria-labelledby="titulo-resumo">
        <h2 id="titulo-resumo" className={styles.rotuloSecao}>
          Resumo
        </h2>
        <ConteudoRichText html={artigo.resumo} tipo="resumo" className={styles.textoRico} sanitizadoNoServidor={!previa} />
      </section>

      {artigo.referenciaBibliografica && (
        <section className={styles.secaoTexto} aria-labelledby="titulo-referencias">
          <h2 id="titulo-referencias" className={styles.rotuloSecao}>
            Referências
          </h2>
          <ConteudoRichText
            html={artigo.referenciaBibliografica}
            tipo="referencia"
            className={`${styles.textoRico} ${styles.referencias}`}
            sanitizadoNoServidor={!previa}
          />
        </section>
      )}

      <section className={styles.fichaArtigo} aria-label="Dados da publicação">
        <dl className={styles.ficha}>
          <div>
            <dt>Publicado em</dt>
            <dd>
              {linkAnais ? <Link href={linkAnais}>{anais.titulo}</Link> : anais.titulo}
              {paginas ? `, ${paginas}` : ""}
            </dd>
          </div>
          <div>
            <dt>Evento</dt>
            <dd>
              {edicao.nome}
              {edicao.dataInicio ? ` · ${formatarPeriodoEdicao(edicao.dataInicio, edicao.dataFim)}` : ""}
              {edicao.cidade ? ` · ${edicao.cidade}` : ""}
            </dd>
          </div>
          {identificadores && (
            <div>
              <dt>Registro</dt>
              <dd>{identificadores}</dd>
            </div>
          )}
          {formatarDataPublicacao(artigo.publicadoEm) && (
            <div>
              <dt>Data de publicação</dt>
              <dd>{formatarDataPublicacao(artigo.publicadoEm)}</dd>
            </div>
          )}
          {licenca && (
            <div>
              <dt>Licença</dt>
              <dd>
                {licenca.url ? (
                  <a href={licenca.url} target="_blank" rel="noopener noreferrer license">
                    {licenca.nome} ({licenca.sigla})
                  </a>
                ) : (
                  licenca.nome
                )}
              </dd>
            </div>
          )}
          {artigo.apresentacao && (
            <div>
              <dt>Apresentado em</dt>
              <dd>
                {edicao.slug ? (
                  <Link href={`/edicoes/${edicao.slug}/atividades/${artigo.apresentacao.slug}`}>{artigo.apresentacao.nome}</Link>
                ) : (
                  artigo.apresentacao.nome
                )}
              </dd>
            </div>
          )}
        </dl>
      </section>
    </>
  );
}
