"use client";

import { usePathname } from "next/navigation";
import MenuConta from "./MenuConta";
import BotaoAjuda from "./BotaoAjuda";
import EdicaoControles from "./EdicaoControles";
import styles from "./Topbar.module.scss";

export default function Topbar({ usuario }) {
  const emParticipante = usePathname().startsWith("/participante");
  return (
    <header className={styles.topbar}>
      <EdicaoControles variante="desktop" usuario={usuario} />
      <div className={styles.direita}>
        {emParticipante && <BotaoAjuda variante="desktop" />}
        <MenuConta usuario={usuario} variante="desktop" />
      </div>
    </header>
  );
}
