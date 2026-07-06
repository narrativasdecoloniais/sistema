import Link from "next/link";
import Logotipo from "./Logotipo";
import styles from "./Header.module.scss";

export default function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.marca} aria-label="Narrativas — página inicial">
        <Logotipo tamanho="pequena" />
      </Link>
      <nav className={styles.nav}>
        <Link href="/login" className={styles.link}>
          Entrar
        </Link>
        <Link href="/cadastro" className={styles.cta}>
          Inscreva-se
        </Link>
      </nav>
    </header>
  );
}
