"use client";

import MenuConta from "./MenuConta";
import EdicaoControles from "./EdicaoControles";
import styles from "./Topbar.module.scss";

export default function Topbar({ usuario }) {
  return (
    <header className={styles.topbar}>
      <EdicaoControles variante="desktop" usuario={usuario} />
      <MenuConta usuario={usuario} variante="desktop" />
    </header>
  );
}
