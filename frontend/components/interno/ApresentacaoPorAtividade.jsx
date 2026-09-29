"use client";

import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ArrowRightLeft, Eye, Trash2 } from "lucide-react";
import ModalConfirmacao from "./ModalConfirmacao";
import DetalheSubmissaoModal from "./DetalheSubmissaoModal";
import ModalVincularAtividade from "./ModalVincularAtividade";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { detalheAtividade } from "@/lib/apresentacao";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./ApresentacaoSubmissoesPainel.module.scss";

// Uma lista por atividade, na ordem de apresentação. ↑/↓ salva a nova ordem
// na hora (PATCH com a lista completa da atividade).
export default function AbaPorAtividade({ edicaoId, dados, modalidades, recarregar }) {
  const { notificar } = useToast();
  const [ocupadoId, setOcupadoId] = useState(null);
  const [removendo, setRemovendo] = useState(null);
  const [detalheId, setDetalheId] = useState(null);
  const [movendo, setMovendo] = useState(null);

  const trabalhosPorAtividade = useMemo(() => {
    const mapa = new Map();
    for (const trabalho of dados.trabalhos) {
      if (!trabalho.atividadeApresentacaoId) continue;
      mapa.set(trabalho.atividadeApresentacaoId, [...(mapa.get(trabalho.atividadeApresentacaoId) || []), trabalho]);
    }
    for (const lista of mapa.values()) lista.sort((a, b) => a.ordemApresentacao - b.ordemApresentacao);
    return mapa;
  }, [dados.trabalhos]);

  const comTrabalhos = dados.atividades.filter((atividade) => trabalhosPorAtividade.has(atividade.id));
  const semTrabalhos = dados.atividades.filter((atividade) => !trabalhosPorAtividade.has(atividade.id));
  const semAtividade = dados.trabalhos.filter((trabalho) => !trabalho.atividadeApresentacaoId).length;

  async function mover(atividadeId, indice, deslocamento) {
    const lista = [...trabalhosPorAtividade.get(atividadeId)];
    const destino = indice + deslocamento;
    if (destino < 0 || destino >= lista.length) return;
    [lista[indice], lista[destino]] = [lista[destino], lista[indice]];
    setOcupadoId(atividadeId);
    try {
      const resposta = await apiClient.patch(`/edicoes/${edicaoId}/apresentacao/atividades/${atividadeId}/ordem`, {
        submissaoIds: lista.map((trabalho) => trabalho.id),
      });
      notificar(resposta.mensagem);
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setOcupadoId(null);
    }
  }

  async function remover() {
    setOcupadoId(removendo.id);
    try {
      const resposta = await apiClient.post(`/edicoes/${edicaoId}/apresentacao/desvincular`, {
        submissaoIds: [removendo.id],
      });
      notificar(resposta.mensagem);
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setOcupadoId(null);
      setRemovendo(null);
    }
  }

  async function moverPara(atividadeId) {
    setOcupadoId(movendo.id);
    try {
      await apiClient.post(`/edicoes/${edicaoId}/apresentacao/vincular`, {
        atividadeId,
        submissaoIds: [movendo.id],
      });
      const destino = dados.atividades.find((atividade) => atividade.id === atividadeId);
      notificar(`Trabalho movido para "${destino?.nome}".`);
      setMovendo(null);
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setOcupadoId(null);
    }
  }

  // Sempre a versão mais recente (a lista recarrega depois de trocar a área).
  const trabalhoEmDetalhe = dados.trabalhos.find((trabalho) => trabalho.id === detalheId);

  if (dados.atividades.length === 0) {
    return (
      <div className={styles.vazio}>
        <p>Nenhuma atividade cadastrada nesta edição.</p>
        <p className={styles.vazioApoio}>Cadastre as atividades (ex. os conversatórios) na tela de Atividades.</p>
      </div>
    );
  }

  return (
    <>
      {semAtividade > 0 && (
        <p className={styles.textoApoio}>
          {semAtividade} {semAtividade === 1 ? "trabalho aprovado ainda está" : "trabalhos aprovados ainda estão"} sem
          atividade — vincule na aba “Trabalhos”.
        </p>
      )}

      {comTrabalhos.length === 0 && (
        <div className={styles.vazio}>
          <p>Nenhum trabalho distribuído ainda.</p>
          <p className={styles.vazioApoio}>
            Selecione trabalhos na aba “Trabalhos” e use “Vincular a atividade”, ou “Distribuir pela área”.
          </p>
        </div>
      )}

      {comTrabalhos.map((atividade) => {
        const lista = trabalhosPorAtividade.get(atividade.id);
        const ocupado = ocupadoId === atividade.id;
        return (
          <section key={atividade.id} className={estilos.cartaoAtividade} aria-labelledby={`atividade-${atividade.id}`}>
            <div className={estilos.cabecalhoAtividade}>
              <h2 id={`atividade-${atividade.id}`} className={estilos.tituloAtividade}>
                {atividade.nome}
              </h2>
              <span className={styles.textoSuave}>
                {detalheAtividade(atividade)} · {lista.length} {lista.length === 1 ? "trabalho" : "trabalhos"}
              </span>
            </div>
            <ol className={estilos.listaTrabalhos}>
              {lista.map((trabalho, indice) => (
                <li key={trabalho.id} className={estilos.itemTrabalho}>
                  <span className={estilos.posicao} aria-hidden="true">
                    {indice + 1}º
                  </span>
                  <div className={estilos.infoTrabalho}>
                    <span className={styles.nome}>{trabalho.titulo}</span>
                    <span className={styles.textoSuave}>
                      {trabalho.autores.map((autor) => autor.nome).join(", ")}
                    </span>
                  </div>
                  <div className={styles.acoesLinha}>
                    <button
                      type="button"
                      className={styles.botaoIcone}
                      aria-label={`Subir "${trabalho.titulo}" na ordem`}
                      disabled={ocupado || indice === 0}
                      onClick={() => mover(atividade.id, indice, -1)}
                    >
                      <ArrowUp size={16} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={styles.botaoIcone}
                      aria-label={`Descer "${trabalho.titulo}" na ordem`}
                      disabled={ocupado || indice === lista.length - 1}
                      onClick={() => mover(atividade.id, indice, 1)}
                    >
                      <ArrowDown size={16} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={styles.botaoIcone}
                      aria-label={`Ver detalhes de "${trabalho.titulo}"`}
                      title="Ver detalhes e alterar a área"
                      onClick={() => setDetalheId(trabalho.id)}
                    >
                      <Eye size={16} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={styles.botaoIcone}
                      aria-label={`Mover "${trabalho.titulo}" para outra atividade`}
                      title="Mover para outra atividade"
                      disabled={ocupado}
                      onClick={() => setMovendo(trabalho)}
                    >
                      <ArrowRightLeft size={16} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                      aria-label={`Remover "${trabalho.titulo}" desta atividade`}
                      disabled={ocupado}
                      onClick={() => setRemovendo(trabalho)}
                    >
                      <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        );
      })}

      {semTrabalhos.length > 0 && (
        <details className={estilos.semTrabalhos}>
          <summary>Atividades sem trabalhos ({semTrabalhos.length})</summary>
          <ul>
            {semTrabalhos.map((atividade) => (
              <li key={atividade.id}>
                <span className={styles.nome}>{atividade.nome}</span>{" "}
                <span className={styles.textoSuave}>· {detalheAtividade(atividade)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {trabalhoEmDetalhe && (
        <DetalheSubmissaoModal
          edicaoId={edicaoId}
          submissao={trabalhoEmDetalhe}
          modalidades={modalidades}
          onFechar={() => setDetalheId(null)}
          onAlterada={recarregar}
        />
      )}

      {movendo && (
        <ModalVincularAtividade
          titulo="Mover para outra atividade"
          descricao={`"${movendo.titulo}" sai da atividade atual (a ordem dos demais é refeita) e entra no fim da ordem da atividade escolhida.`}
          atividades={dados.atividades}
          atividadeAtualId={movendo.atividadeApresentacaoId}
          selecionados={[movendo]}
          processando={ocupadoId === movendo.id}
          onFechar={() => setMovendo(null)}
          onConfirmar={moverPara}
        />
      )}

      {removendo && (
        <ModalConfirmacao
          titulo="Remover da atividade"
          mensagem={`"${removendo.titulo}" sai desta atividade e a ordem dos demais é refeita.`}
          rotuloConfirmar="Remover"
          confirmando={ocupadoId === removendo.id}
          onConfirmar={remover}
          onCancelar={() => setRemovendo(null)}
        />
      )}
    </>
  );
}
