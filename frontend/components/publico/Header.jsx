import Link from "next/link";
import Logo from "./Logo";
import styles from "./Header.module.scss";

export default function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.marca}>
        <Logo tamanho="pequena" />
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
