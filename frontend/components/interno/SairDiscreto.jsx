"use client";

import { useLogout } from "@/lib/useLogout";
import styles from "./SairDiscreto.module.scss";

export default function SairDiscreto() {
  const { sair, saindo } = useLogout();

  return (
    <button type="button" className={styles.sair} onClick={sair} disabled={saindo}>
      {saindo ? "Saindo..." : "Sair"}
    </button>
  );
}
