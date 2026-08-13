import Link from "next/link";
import MarcaRodape from "@/components/graficos/MarcaRodape";
import { listarEdicoesAnteriores } from "@/lib/publico";
import { paraNumeroRomano } from "@/lib/romanos";
import styles from "./Footer.module.scss";

const ANCORAS = [
  { href: "/#submissao", rotulo: "Submissão" },
  { href: "/#atividades", rotulo: "Atividades" },
  { href: "/#programacao", rotulo: "Programação" },
  { href: "/#anais", rotulo: "Anais" },
];

export default async function Footer() {
  const edicoesAnteriores = await listarEdicoesAnteriores();

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
                )
              )}
            </ul>
          )}
        </div>

        <div className={styles.coluna}>
          <h2 className={styles.tituloColuna}>Institucional</h2>
          <p className={styles.emBreve}>Política de privacidade — em breve</p>
          <p className={styles.emBreve}>Contato — em breve</p>
        </div>
      </div>

      <div className={styles.linhaCreditos}>
        <MarcaRodape tamanho={22} />
        <p className={styles.creditos}>
          GPDES/UnB — Educação, Saberes e Decolonialidades
        </p>
      </div>
    </footer>
  );
}
