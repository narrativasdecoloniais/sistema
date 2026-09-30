"use client";

import { useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Conta uma visualização por sessão do navegador (recarregar a página não
// soma de novo). Sem corpo visual. Falha em silêncio — é só estatística.
export default function ContadorVisualizacao({ artigoId }) {
  useEffect(() => {
    const chave = `anais-visto-${artigoId}`;
    try {
      if (sessionStorage.getItem(chave)) return;
      sessionStorage.setItem(chave, "1");
    } catch {
      // Armazenamento bloqueado: conta mesmo assim.
    }
    fetch(`${API_URL}/publico/anais/artigos/${artigoId}/visualizacao`, { method: "POST", keepalive: true }).catch(() => {});
  }, [artigoId]);

  return null;
}
