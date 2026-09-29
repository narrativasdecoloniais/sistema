"use client";

import { useEffect, useState } from "react";
import { CONFIG_RESUMO, CONFIG_REFERENCIA, CONFIG_TEXTO, sanitizarRichText } from "@/lib/richText";

const CONFIGS = { resumo: CONFIG_RESUMO, referencia: CONFIG_REFERENCIA, texto: CONFIG_TEXTO };

// ÚNICA forma permitida de exibir resumo/referência de submissão (e textos
// rich text da organização): sanitiza de novo no navegador, com a mesma
// allowlist do backend, antes de injetar o HTML. No render do servidor sai
// vazio (DOMPurify precisa de window) e preenche logo após a hidratação —
// preencher já no primeiro render quebraria a hidratação.
export default function ConteudoRichText({ html, tipo = "resumo", className, vazio = null }) {
  const [seguro, setSeguro] = useState(null);

  useEffect(() => {
    setSeguro(sanitizarRichText(html || "", CONFIGS[tipo]));
  }, [html, tipo]);

  if (seguro === "" && vazio) return vazio;
  return <div className={className} dangerouslySetInnerHTML={{ __html: seguro || "" }} />;
}
