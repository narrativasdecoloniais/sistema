"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";

export function useLogout() {
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

  return { sair, saindo };
}
