"use client";

import { useMemo, useState } from "react";
import Botao from "@/components/forms/Botao";
import ModalConfirmacao from "./ModalConfirmacao";
import CabecalhoTabela, { LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { STATUS_SUGESTAO, ROTULOS_STATUS_SUGESTAO } from "@/lib/avaliacoes";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";

function formatarData(valor) {
  return new Date(valor).toLocaleDateString("pt-BR", { dateStyle: "short" });
}

export default function AbaSugestoes({ edicaoId, sugestoes, modalidades, recarregar }) {
  const { notificar } = useToast();
  const [resolvendo, setResolvendo] = useState(null);
  const [processando, setProcessando] = useState(false);

  const colunas = useMemo(
    () => [
      { chave: "titulo", rotulo: "Trabalho", valor: (sugestao) => sugestao.submissao.titulo },
      {
        chave: "modalidade",
        rotulo: "Modalidade",
        valor: (sugestao) => sugestao.submissao.modalidadeSubmissao.nome,
        filtro: "select",
        opcoes: modalidades.map((modalidade) => ({ valor: modalidade.id, rotulo: modalidade.nome })),
        corresponde: (sugestao, modalidadeId) => sugestao.submissao.modalidadeSubmissao.id === modalidadeId,
      },
      { chave: "avaliador", rotulo: "Sugerida por", valor: (sugestao) => sugestao.avaliadorEdicao.usuario.nome },
      { chave: "areaAtual", rotulo: "Área na época", valor: (sugestao) => sugestao.areaAtual?.titulo || null },
      { chave: "areaSugerida", rotulo: "Área sugerida", valor: (sugestao) => sugestao.areaSugerida.titulo },
      { chave: "justificativa", rotulo: "Justificativa", valor: (sugestao) => sugestao.justificativa || null },
      {
        chave: "data",
        rotulo: "Data",
        valor: (sugestao) => new Date(sugestao.createdAt).getTime(),
        texto: (sugestao) => formatarData(sugestao.createdAt),
        classe: styles.colunaCurta,
      },
      {
        chave: "status",
        rotulo: "Status",
        valor: (sugestao) => ROTULOS_STATUS_SUGESTAO[sugestao.status],
        filtro: "select",
        opcoes: STATUS_SUGESTAO,
        corresponde: (sugestao, status) => sugestao.status === status,
      },
    ],
    [modalidades]
  );

  const tabela = useTabela(sugestoes, colunas);
  const sugestaoEmResolucao = sugestoes.find((sugestao) => sugestao.id === resolvendo?.id);

  async function resolver() {
    setProcessando(true);
    try {
      const resposta = await apiClient.patch(`/edicoes/${edicaoId}/avaliacoes/sugestoes/${resolvendo.id}`, {
        aprovar: resolvendo.aprovar,
      });
      notificar(resposta.mensagem);
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessando(false);
      setResolvendo(null);
    }
  }

  if (sugestoes.length === 0) {
    return (
      <div className={styles.vazio}>
        <p>Nenhuma sugestão de troca de área.</p>
        <p className={styles.vazioApoio}>
          Quando um avaliador indicar que um trabalho está na área errada, a sugestão aparece aqui para você aprovar ou
          recusar.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.tabelaWrapper}>
        <BotaoExportarTabela tabela={tabela} nomeArquivo="trocas-de-area" nomeAba="Trocas de área" />
        <table className={styles.tabela}>
          <CabecalhoTabela tabela={tabela} idTabela="sugestoes-troca-area" classeAcoes={styles.colunaAcoes} />
          <tbody>
            {tabela.linhasVisiveis.length === 0 && <LinhaSemResultado tabela={tabela} colSpan={colunas.length + 1} />}
            {tabela.linhasVisiveis.map((sugestao) => (
              <tr key={sugestao.id}>
                <td data-rotulo="Trabalho">{sugestao.submissao.titulo}</td>
                <td data-rotulo="Modalidade">{sugestao.submissao.modalidadeSubmissao.nome}</td>
                <td data-rotulo="Sugerida por">{sugestao.avaliadorEdicao.usuario.nome}</td>
                <td data-rotulo="Área na época">{sugestao.areaAtual?.titulo || "—"}</td>
                <td data-rotulo="Área sugerida">{sugestao.areaSugerida.titulo}</td>
                <td data-rotulo="Justificativa">
                  {sugestao.justificativa || <span className={styles.textoSuave}>—</span>}
                </td>
                <td data-rotulo="Data" className={styles.colunaCurta}>
                  {formatarData(sugestao.createdAt)}
                </td>
                <td data-rotulo="Status">
                  {sugestao.status === "PENDENTE" ? (
                    <span className={styles.tag}>Pendente</span>
                  ) : (
                    <span className={styles.textoSuave}>{ROTULOS_STATUS_SUGESTAO[sugestao.status]}</span>
                  )}
                </td>
                <td data-rotulo="Ações" className={styles.colunaAcoes}>
                  {sugestao.status === "PENDENTE" && (
                    <div className={styles.acoesLinha}>
                      <Botao
                        type="button"
                        variante="secundario"
                        onClick={() => setResolvendo({ id: sugestao.id, aprovar: false })}
                      >
                        Recusar
                      </Botao>
                      <Botao type="button" onClick={() => setResolvendo({ id: sugestao.id, aprovar: true })}>
                        Aprovar
                      </Botao>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sugestaoEmResolucao && (
        <ModalConfirmacao
          titulo={resolvendo.aprovar ? "Aprovar troca de área" : "Recusar sugestão"}
          mensagem={
            resolvendo.aprovar
              ? `"${sugestaoEmResolucao.submissao.titulo}" passa para a área "${sugestaoEmResolucao.areaSugerida.titulo}". Todas as atribuições atuais (e decisões já registradas) serão descartadas e o trabalho será redistribuído aos avaliadores da nova área.`
              : `Recusar a sugestão de ${sugestaoEmResolucao.avaliadorEdicao.usuario.nome}? O trabalho continua na área atual e o avaliador poderá registrar a decisão.`
          }
          rotuloConfirmar={resolvendo.aprovar ? "Aprovar troca" : "Recusar"}
          perigo={!resolvendo.aprovar}
          confirmando={processando}
          onConfirmar={resolver}
          onCancelar={() => setResolvendo(null)}
        />
      )}
    </>
  );
}
