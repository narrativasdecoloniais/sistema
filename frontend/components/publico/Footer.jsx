import Link from "next/link";
import MarcaRodape from "@/components/graficos/MarcaRodape";
import {
  listarEdicoesAnteriores,
  listarProgramasPosGraduacaoPublico,
} from "@/lib/publico";
import { paraNumeroRomano } from "@/lib/romanos";
import styles from "./Footer.module.scss";

const ANCORAS = [
  { href: "/#submissao", rotulo: "Submissão" },
  { href: "/#programacao", rotulo: "Programação" },
  { href: "/#anais", rotulo: "Anais" },
];

export default async function Footer({ edicao }) {
  const edicoesAnteriores = await listarEdicoesAnteriores();
  const programasPosGraduacao = await listarProgramasPosGraduacaoPublico();

  return (
    <footer className={styles.footer}>
      <div className={styles.colunas}>
        <nav aria-label="Links do rodapé" className={styles.coluna}>
          <h2 className={styles.tituloColuna}>Navegação</h2>
          <ul className={styles.lista}>
            {ANCORAS.map((ancora) => (
              <li key={ancora.href}>
                <Link href={ancora.href}>{ancora.rotulo}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.coluna}>
          <h2 className={styles.tituloColuna}>Edições anteriores</h2>
          {edicoesAnteriores.length === 0 ? (
            <p className={styles.emBreve}>Em breve</p>
          ) : (
            <ul className={styles.lista}>
              {edicoesAnteriores.map((edicao) =>
                edicao.slug ? (
                  <li key={edicao.id}>
                    <Link href={`/edicoes/${edicao.slug}`}>
                      {paraNumeroRomano(edicao.numero)} edição — {edicao.nome}
                    </Link>
                  </li>
                ) : (
                  <li key={edicao.id} className={styles.semLink}>
                    {paraNumeroRomano(edicao.numero)} edição — {edicao.nome}
                  </li>
                ),
              )}
            </ul>
          )}
        </div>

        <div className={styles.coluna}>
          <h2 className={styles.tituloColuna}>Institucional</h2>
          <p className={styles.emBreve}>Política de privacidade — em breve</p>
          {edicao?.emailContato ? (
            <a
              href={`mailto:${edicao.emailContato}`}
              className={styles.contatoLink}
            >
              {edicao.emailContato}
            </a>
          ) : (
            <p className={styles.emBreve}>Contato — em breve</p>
          )}
        </div>
      </div>

      <div className={styles.linhaCreditos}>
        <MarcaRodape tamanho={22} />
        <p className={styles.creditos}>
          Grupo de Pesquisa Educação, Saberes e Decolonialidades — GPDES/UnB
        </p>
        <MarcaRodape tamanho={22} />
      </div>

      {programasPosGraduacao.length > 0 && (
        <div className={styles.programasPosGraduacao}>
          <span className={styles.programasPosGraduacaoLabel}>
            Programas de Pós-Graduação
          </span>
          <ul className={styles.programasPosGraduacaoLista}>
            {programasPosGraduacao.map((programa) => {
              const conteudo = programa.imagem ? (
                <img
                  src={programa.imagem}
                  alt={programa.nome}
                  className={styles.programaLogo}
                />
              ) : (
                <span className={styles.programaNome}>{programa.nome}</span>
              );
              return (
                <li key={programa.id}>
                  {programa.link ? (
                    <a
                      href={programa.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.programaItem}
                    >
                      {conteudo}
                    </a>
                  ) : (
                    <span className={styles.programaItem}>{conteudo}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </footer>
  );
}
