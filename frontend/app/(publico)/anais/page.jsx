import Link from "next/link";
import Divisor from "@/components/graficos/Divisor";
import { listarEdicoesComAnais } from "@/lib/anaisServidor";
import { linhaIdentificadores } from "@/lib/anais";
import { paraNumeroRomano } from "@/lib/romanos";
import styles from "./anais.module.scss";

export const metadata = {
  title: "Anais — Narrativas",
  description:
    "Anais das edições do Narrativas Interculturais, Decoloniais e Antirracistas em Educação (GPDES/UnB): trabalhos completos, resumos e referências.",
  alternates: { canonical: "/anais" },
};

export default async function PaginaAnais() {
  const edicoes = await listarEdicoesComAnais();

  return (
    <article className={styles.pagina}>
      <header className={styles.cabecalho}>
        <span className={styles.eyebrow}>Publicações</span>
        <h1 className={`${styles.titulo} stencil`}>Anais</h1>
        <p className={styles.subtitulo}>
          Os trabalhos apresentados em cada edição do evento, com resumo, referências e forma de citar.
        </p>
      </header>

      <Divisor className={styles.divisor} />

      {edicoes.length === 0 ? (
        <p className={styles.aviso}>Nenhum volume dos Anais foi publicado ainda. Volte em breve.</p>
      ) : (
        <ul className={styles.listaEdicoes}>
          {edicoes.map((edicao) => {
            const identificadores = linhaIdentificadores(edicao.anais);
            return (
              <li key={edicao.slug}>
                <Link href={`/anais/${edicao.slug}`} className={styles.cartaoEdicao}>
                  <span className={styles.cartaoEyebrow}>{paraNumeroRomano(edicao.numero)} edição</span>
                  <span className={styles.cartaoTitulo}>{edicao.anais.titulo}</span>
                  {edicao.anais.subtitulo && <span className={styles.cartaoSubtitulo}>{edicao.anais.subtitulo}</span>}
                  <span className={styles.cartaoMeta}>
                    {[`${edicao.totalArtigos} ${edicao.totalArtigos === 1 ? "trabalho" : "trabalhos"}`, identificadores]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <span className={styles.cartaoAcao}>Acessar os Anais →</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
