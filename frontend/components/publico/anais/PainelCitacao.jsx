"use client";

import { useEffect, useId, useState } from "react";
import { citacaoAbnt, citacaoApa, citacaoBibtex, citacaoRis, htmlCitacao, textoCitacao } from "@/lib/citacao";
import { useToast } from "@/components/publico/ToastProvider";
import styles from "./PainelCitacao.module.scss";

const FORMATOS = [
  { id: "abnt", rotulo: "ABNT", gerar: citacaoAbnt, tagDestaque: "strong" },
  { id: "apa", rotulo: "APA", gerar: citacaoApa, tagDestaque: "em" },
];

function baixar(conteudo, nomeArquivo, tipo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Copia com formatação (negrito/itálico do título dos Anais) para quem cola
// num editor de texto, e em texto puro como alternativa.
async function copiar(trechos, tagDestaque) {
  const texto = textoCitacao(trechos);
  const html = htmlCitacao(trechos, tagDestaque);
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": new Blob([texto], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" }),
      }),
    ]);
    return;
  }
  await navigator.clipboard.writeText(texto);
}

// Painel "Citar" da página do trabalho: referência pronta em ABNT e APA
// (o "Acesso em" usa a data de hoje) e arquivos .bib/.ris para gerenciadores
// de referência (Zotero, Mendeley…).
export default function PainelCitacao({ citacao, slug }) {
  const { notificar } = useToast();
  const [aberto, setAberto] = useState(false);
  const [formatoId, setFormatoId] = useState("abnt");
  // A data de acesso é a do navegador de quem cita — calculada só no cliente.
  const [acessoEm, setAcessoEm] = useState(null);
  const idPainel = useId();

  useEffect(() => {
    setAcessoEm(new Date());
  }, []);

  const formato = FORMATOS.find((item) => item.id === formatoId);
  const dados = { ...citacao, acessoEm: acessoEm || new Date() };
  const trechos = formato.gerar(dados);

  async function aoCopiar() {
    try {
      await copiar(trechos, formato.tagDestaque);
      notificar(`Referência ${formato.rotulo} copiada.`);
    } catch {
      notificar("Não foi possível copiar. Selecione o texto e copie manualmente.", "erro");
    }
  }

  async function aoCopiarLink() {
    try {
      await navigator.clipboard.writeText(citacao.url || window.location.href);
      notificar("Link do trabalho copiado.");
    } catch {
      notificar("Não foi possível copiar o link.", "erro");
    }
  }

  return (
    <div className={styles.citar}>
      <div className={styles.botoes}>
        <button
          type="button"
          className={styles.botao}
          aria-expanded={aberto}
          aria-controls={idPainel}
          onClick={() => setAberto((valor) => !valor)}
        >
          {aberto ? "Fechar citação" : "Citar este trabalho"}
        </button>
        <button type="button" className={styles.botao} onClick={aoCopiarLink}>
          Copiar link
        </button>
      </div>

      {aberto && (
        <div id={idPainel} className={styles.painel}>
          <div className={styles.abas} role="tablist" aria-label="Formato da referência">
            {FORMATOS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={item.id === formatoId}
                className={`${styles.aba} ${item.id === formatoId ? styles.abaAtiva : ""}`}
                onClick={() => setFormatoId(item.id)}
              >
                {item.rotulo}
              </button>
            ))}
          </div>

          <p className={styles.referencia} role="tabpanel" aria-label={`Referência em ${formato.rotulo}`}>
            {trechos.map((trecho, indice) =>
              trecho.destaque ? (
                formato.tagDestaque === "strong" ? <strong key={indice}>{trecho.texto}</strong> : <em key={indice}>{trecho.texto}</em>
              ) : (
                <span key={indice}>{trecho.texto}</span>
              )
            )}
          </p>

          <div className={styles.acoes}>
            <button type="button" className={styles.botaoPrincipal} onClick={aoCopiar}>
              Copiar referência
            </button>
            <button
              type="button"
              className={styles.link}
              onClick={() => baixar(citacaoBibtex(citacao), `${slug}.bib`, "application/x-bibtex;charset=utf-8")}
            >
              Baixar BibTeX (.bib)
            </button>
            <button
              type="button"
              className={styles.link}
              onClick={() => baixar(citacaoRis(citacao), `${slug}.ris`, "application/x-research-info-systems;charset=utf-8")}
            >
              Baixar RIS (.ris)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
