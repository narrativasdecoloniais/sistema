"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.scss";

export default function Sidebar({ usuario }) {
  const pathname = usePathname();
  const podeAdministrar = usuario?.papeis?.some((papel) =>
    ["ADMIN", "ORGANIZADOR"].includes(papel)
  );

  return (
    <aside className={styles.sidebar}>
      <div className={styles.marca}>Narrativas</div>
      <nav className={styles.nav}>
        <Link
          href="/participante"
          className={`${styles.link} ${pathname === "/participante" ? styles.ativo : ""}`}
        >
          Meu perfil
        </Link>
        {podeAdministrar && (
          <Link
            href="/admin"
            className={`${styles.link} ${pathname.startsWith("/admin") ? styles.ativo : ""}`}
          >
            Administração
          </Link>
        )}
      </nav>
    </aside>
  );
}
