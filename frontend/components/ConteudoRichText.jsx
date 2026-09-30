"use client";

import { useEffect, useState } from "react";
import {
  CONFIG_RESUMO,
  CONFIG_REFERENCIA,
  CONFIG_TEXTO,
  CONFIG_EDITAL,
  CONFIG_CERTIFICADO,
  sanitizarRichText,
} from "@/lib/richText";

const CONFIGS = {
  resumo: CONFIG_RESUMO,
  referencia: CONFIG_REFERENCIA,
  texto: CONFIG_TEXTO,
  edital: CONFIG_EDITAL,
  certificado: CONFIG_CERTIFICADO,
};

// ÚNICA forma permitida de exibir resumo/referência de submissão (e textos
// rich text da organização): sanitiza de novo no navegador, com a mesma
// allowlist do backend, antes de injetar o HTML. No render do servidor sai
// vazio (DOMPurify precisa de window) e preenche logo após a hidratação —
// preencher já no primeiro render quebraria a hidratação.
//
// Exceção: sanitizadoNoServidor, para páginas que precisam do texto no HTML
// do servidor (SEO dos Anais). Só vale para HTML que o backend acabou de
// sanitizar na leitura (anais.service.js) — aí o 1º render já mostra o
// conteúdo e o useEffect sanitiza de novo no navegador, como nos demais.
export default function ConteudoRichText({ html, tipo = "resumo", className, vazio = null, sanitizadoNoServidor = false }) {
  const [seguro, setSeguro] = useState(sanitizadoNoServidor ? html || "" : null);

  useEffect(() => {
    setSeguro(sanitizarRichText(html || "", CONFIGS[tipo]));
  }, [html, tipo]);

  if (seguro === "" && vazio) return vazio;
  return <div className={className} dangerouslySetInnerHTML={{ __html: seguro || "" }} />;
}
