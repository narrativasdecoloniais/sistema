"use client";

import { useState } from "react";
import { ExternalLink, Eye, EyeOff } from "lucide-react";
import ModalConfirmacao from "../ModalConfirmacao";
import LinkEditarSubmissao from "../LinkEditarSubmissao";
import CabecalhoTabela, { CelulaSelecao, LinhaSemResultado } from "../CabecalhoTabela";
import BotaoExportarTabela, { BotaoAcaoTabela } from "../BotaoExportarTabela";
import useTabela from "../useTabela";
import useSelecaoLinhas from "../useSelecaoLinhas";
import { useToast } from "../ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { rotuloPaginas } from "@/lib/anais";
import styles from "../AvaliacaoSubmissoesPainel.module.scss";

const ROTULOS_SITUACAO = { PUBLICADO: "Nos Anais", OCULTO: "Oculto" };
const situacaoDe = (artigo) => (artigo.ocultoEm ? "OCULTO" : "PUBLICADO");
const autoresDe = (artigo) => artigo.submissao.autores.map((autor) => autor.nome).join("; ");

const COLUNAS = [
  { chave: "titulo", rotulo: "Título", valor: (a) => a.submissao.titulo },
  { chave: "autores", rotulo: "Autores", valor: autoresDe },
  { chave: "modalidade", rotulo: "Modalidade", valor: (a) => a.submissao.modalidadeSubmissao?.nome || null, filtro: "select" },
  { chave: "area", rotulo: "Área", valor: (a) => a.submissao.areaSubmissao?.titulo || null, filtro: "select" },
  {
    chave: "paginas",
    rotulo: "Páginas no PDF",
    valor: (a) => a.paginaInicial ?? null,
    texto: (a) => rotuloPaginas(a.paginaInicial, a.paginaFinal) || "",
  },
  { chave: "visualizacoes", rotulo: "Visualizações", valor: (a) => a.visualizacoes },
  { chave: "downloads", rotulo: "Downloads do PDF", valor: (a) => a.downloads },
  { chave: "comentarios", rotulo: "Comentários", valor: (a) => a.comentarios },
  {
    chave: "situacao",
    rotulo: "Situação",
    valor: situacaoDe,
    filtro: "select",
    opcoes: Object.entries(ROTULOS_SITUACAO).map(([valor, rotulo]) => ({ valor, rotulo })),
    exportar: (a) => ROTULOS_SITUACAO[situacaoDe(a)],
  },
];

// Trabalhos que entram nos Anais (critério em backend/src/utils/criterioAnais.js),
// com contadores de acesso e a opção de ocultar um trabalho das páginas
// públicas e dos arquivos sem mexer na submissão.
export default function AnaisArtigosAba({ edicaoId, artigos, publicado, aoAlterar }) {
  const { notificar } = useToast();
  const tabela = useTabela(artigos, COLUNAS);
  const selecao = useSelecaoLinhas(tabela);
  const [confirmacao, setConfirmacao] = useState(null);
  const [processando, setProcessando] = useState(false);

  function confirmarOcultacao(ids, ocultar, descricao) {
    setConfirmacao({
      titulo: ocultar ? "Ocultar dos Anais" : "Mostrar nos Anais",
      mensagem: ocultar
        ? `${descricao} sai das páginas públicas, da busca e dos próximos PDF/Word gerados. A submissão e os comentários continuam guardados.`
        : `${descricao} volta às páginas públicas e entra nos próximos PDF/Word gerados.`,
      rotulo: ocultar ? "Ocultar" : "Mostrar",
      perigo: ocultar,
      ids,
      ocultar,
    });
  }

  async function executar() {
    setProcessando(true);
    try {
      const resposta = await apiClient.patch(`/edicoes/${edicaoId}/anais/artigos/ocultacao`, {
        ids: confirmacao.ids,
        oculto: confirmacao.ocultar,
      });
      notificar(resposta.mensagem);
      selecao.limpar();
      setConfirmacao(null);
      await aoAlterar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessando(false);
    }
  }

  function idsSelecionados() {
    return tabela.linhasVisiveis.filter((linha) => selecao.estaSelecionado(linha.id)).map((linha) => linha.id);
  }

  if (artigos.length === 0) {
    return (
      <div className={styles.vazio}>
        <p>Nenhum trabalho entra nos Anais por enquanto.</p>
        <p className={styles.vazioApoio}>
          Entram as submissões com decisão final &quot;Pendente de revisão&quot; (registrada em Resultado) em que algum dos autores fez o credenciamento no evento.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className={styles.textoApoio}>
        As páginas no PDF são preenchidas a cada geração dos Anais completos em PDF e entram na referência de cada
        trabalho. Visualizações contam uma por sessão do navegador.
      </p>

      <div className={styles.tabelaWrapper}>
        <BotaoExportarTabela tabela={tabela} nomeArquivo="anais-trabalhos" nomeAba="Trabalhos">
          {selecao.quantidade > 0 && (
            <>
              <BotaoAcaoTabela onClick={() => confirmarOcultacao(idsSelecionados(), false, `${selecao.quantidade} trabalho(s)`)}>
                <Eye size={16} strokeWidth={1.5} aria-hidden="true" />
                Mostrar ({selecao.quantidade})
              </BotaoAcaoTabela>
              <BotaoAcaoTabela perigo onClick={() => confirmarOcultacao(idsSelecionados(), true, `${selecao.quantidade} trabalho(s)`)}>
                <EyeOff size={16} strokeWidth={1.5} aria-hidden="true" />
                Ocultar ({selecao.quantidade})
              </BotaoAcaoTabela>
            </>
          )}
        </BotaoExportarTabela>
        <table className={styles.tabela}>
          <CabecalhoTabela tabela={tabela} idTabela="anais-trabalhos" classeAcoes={styles.colunaAcoes} selecao={selecao} />
          <tbody>
            {tabela.linhasVisiveis.length === 0 && <LinhaSemResultado tabela={tabela} colSpan={COLUNAS.length + 2} />}
            {tabela.linhasVisiveis.map((artigo) => {
              const oculto = Boolean(artigo.ocultoEm);
              return (
                <tr key={artigo.id}>
                  <CelulaSelecao selecao={selecao} id={artigo.id} rotulo={`Selecionar ${artigo.submissao.titulo}`} />
                  <td data-rotulo="Título">{artigo.submissao.titulo}</td>
                  <td data-rotulo="Autores">{autoresDe(artigo)}</td>
                  <td data-rotulo="Modalidade">{artigo.submissao.modalidadeSubmissao?.nome || "—"}</td>
                  <td data-rotulo="Área">{artigo.submissao.areaSubmissao?.titulo || "—"}</td>
                  <td data-rotulo="Páginas no PDF">{rotuloPaginas(artigo.paginaInicial, artigo.paginaFinal) || "—"}</td>
                  <td data-rotulo="Visualizações">{artigo.visualizacoes}</td>
                  <td data-rotulo="Downloads do PDF">{artigo.downloads}</td>
                  <td data-rotulo="Comentários">{artigo.comentarios}</td>
                  <td data-rotulo="Situação">{oculto ? <strong>Oculto</strong> : ROTULOS_SITUACAO.PUBLICADO}</td>
                  <td data-rotulo="Ações" className={styles.colunaAcoes}>
                    <div className={styles.acoesLinha}>
                      {publicado && !oculto && artigo.url && (
                        <a
                          href={artigo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.botaoIcone}
                          aria-label={`Ver "${artigo.submissao.titulo}" no site`}
                          title="Ver no site"
                        >
                          <ExternalLink size={16} strokeWidth={1.5} aria-hidden="true" />
                        </a>
                      )}
                      <LinkEditarSubmissao edicaoId={edicaoId} submissao={artigo.submissao} className={styles.botaoIcone} />
                      {oculto ? (
                        <button
                          type="button"
                          className={styles.botaoIcone}
                          aria-label={`Mostrar "${artigo.submissao.titulo}" nos Anais`}
                          title="Mostrar nos Anais"
                          onClick={() => confirmarOcultacao([artigo.id], false, "O trabalho")}
                        >
                          <Eye size={16} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                          aria-label={`Ocultar "${artigo.submissao.titulo}" dos Anais`}
                          title="Ocultar dos Anais"
                          onClick={() => confirmarOcultacao([artigo.id], true, "O trabalho")}
                        >
                          <EyeOff size={16} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {confirmacao && (
        <ModalConfirmacao
          titulo={confirmacao.titulo}
          mensagem={confirmacao.mensagem}
          rotuloConfirmar={confirmacao.rotulo}
          perigo={confirmacao.perigo}
          confirmando={processando}
          onConfirmar={executar}
          onCancelar={() => setConfirmacao(null)}
        />
      )}
    </>
  );
}
