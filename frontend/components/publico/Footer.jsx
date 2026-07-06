import Link from "next/link";
import Divisor from "@/components/graficos/Divisor";
import MarcaRodape from "@/components/graficos/MarcaRodape";
import styles from "./Footer.module.scss";

const ANCORAS = [
  { href: "/#inscricoes", rotulo: "Inscrições" },
  { href: "/#programacao", rotulo: "Programação" },
  { href: "/#eixos", rotulo: "Eixos" },
  { href: "/#anais", rotulo: "Anais" },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.divisorTopo}>
        <Divisor />
      </div>
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
          <p className={styles.emBreve}>Em breve</p>
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
          GPDES/UnB — Grupo de Pesquisa Diáspora, Educação e Sociedade
        </p>
      </div>
    </footer>
  );
}
