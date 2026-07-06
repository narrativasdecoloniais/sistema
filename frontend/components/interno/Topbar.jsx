"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import styles from "./Topbar.module.scss";

export default function Topbar({ usuario }) {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    setSaindo(true);
    try {
      await apiClient.post("/auth/logout");
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <header className={styles.topbar}>
      <span className={styles.nome}>{usuario?.nome}</span>
      <button type="button" className={styles.sair} onClick={sair} disabled={saindo}>
        {saindo ? "Saindo..." : "Sair"}
      </button>
    </header>
  );
}
