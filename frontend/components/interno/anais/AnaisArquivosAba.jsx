"use client";

import { useState } from "react";
import { Download, FileDown, FileType, Loader2 } from "lucide-react";
import Botao from "@/components/forms/Botao";
import { useToast } from "../ToastProvider";
import { apiClient } from "@/lib/apiClient";
import styles from "../AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./AnaisPainel.module.scss";

function formatarDataHora(valor) {
  return valor
    ? new Date(valor).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
}

const FORMATOS = [
  {
    chave: "pdf",
    rotulo: "PDF",
    Icone: FileDown,
    campoUrl: "pdfUrl",
    campoData: "pdfGeradoEm",
    descricao:
      "Versão final para leitura e impressão: capa, folha de rosto, ficha catalográfica, expediente, apresentação, sumário com páginas, os trabalhos (cada um em página nova, com referência para citação) e índice de autores. Depois de publicados os Anais, fica disponível para download no site. Cada geração também atualiza as páginas de cada trabalho usadas nas citações.",
  },
  {
    chave: "docx",
    rotulo: "Word",
    Icone: FileType,
    campoUrl: "docxUrl",
    campoData: "docxGeradoEm",
    descricao:
      "Mesma estrutura, editável — para revisão ou diagramação. Sumário, índice de autores e páginas das citações são campos do Word: ao abrir, confirme “atualizar campos” (ou clique com o botão direito no sumário → Atualizar campo). Fica só aqui no admin.",
  },
];

// Geração dos Anais completos em segundo plano — o painel (AnaisPainel)
// acompanha até terminar e avisa por toast.
export default function AnaisArquivosAba({ edicaoId, anais, configurado, gerando, aoIniciar }) {
  const { notificar } = useToast();
  const [iniciando, setIniciando] = useState(null);

  async function gerar(formato) {
    setIniciando(formato);
    try {
      const resposta = await apiClient.post(`/edicoes/${edicaoId}/anais/arquivos/${formato}`);
      notificar(resposta.mensagem);
      await aoIniciar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setIniciando(null);
    }
  }

  if (!configurado) {
    return (
      <div className={styles.vazio}>
        <p>Salve as configurações dos Anais antes de gerar os arquivos.</p>
        <p className={styles.vazioApoio}>Título, ISSN/ISBN e dados de publicação vão para a capa e a folha de rosto.</p>
      </div>
    );
  }

  return (
    <>
      {anais.erroGeracao && !gerando && (
        <p className={estilos.erro} role="alert">
          A última geração falhou: {anais.erroGeracao}
        </p>
      )}
      <div className={estilos.gradeArquivos}>
        {FORMATOS.map(({ chave, rotulo, Icone, campoUrl, campoData, descricao }) => {
          const url = anais[campoUrl];
          const geradoEm = formatarDataHora(anais[campoData]);
          const gerandoEste = gerando === chave;
          return (
            <article key={chave} className={estilos.cartaoArquivo}>
              <div className={estilos.cabecalhoArquivo}>
                <Icone size={20} strokeWidth={1.5} aria-hidden="true" />
                <h2 className={estilos.tituloArquivo}>Anais em {rotulo}</h2>
              </div>
              <p className={styles.textoApoio}>{descricao}</p>
              <p className={estilos.statusArquivo} aria-live="polite">
                {gerandoEste ? (
                  <>
                    <Loader2 size={16} strokeWidth={1.5} aria-hidden="true" className={estilos.girando} />
                    Gerando… isso pode levar alguns minutos.
                  </>
                ) : geradoEm ? (
                  `Última geração: ${geradoEm}`
                ) : (
                  "Ainda não gerado."
                )}
              </p>
              <div className={estilos.acoesArquivo}>
                <Botao
                  type="button"
                  variante={url ? "secundario" : "primario"}
                  carregando={iniciando === chave}
                  disabled={Boolean(gerando)}
                  onClick={() => gerar(chave)}
                >
                  {url ? "Gerar de novo" : `Gerar ${rotulo}`}
                </Botao>
                {url && !gerandoEste && (
                  <a href={url} className={estilos.linkDownload} target="_blank" rel="noopener noreferrer">
                    <Download size={16} strokeWidth={1.5} aria-hidden="true" />
                    Baixar {rotulo}
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <p className={styles.textoApoio}>
        Os arquivos refletem os trabalhos e as configurações do momento da geração: depois de editar textos, ocultar
        trabalhos ou mudar o ISSN/ISBN, gere de novo.
      </p>
    </>
  );
}
