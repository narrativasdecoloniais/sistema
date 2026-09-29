"use client";

import { useState } from "react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import CampoTexto from "./CampoTexto";
import CampoSelecao from "./CampoSelecao";
import { detalheAtividade } from "@/lib/apresentacao";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./ApresentacaoSubmissoesPainel.module.scss";

// Busca sem acento/caixa ("sessao 1" acha "Sessão 1 –").
function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function ModalVincularAtividade({
  atividades,
  selecionados,
  processando,
  onFechar,
  onConfirmar,
  titulo = "Vincular a atividade",
  descricao,
  atividadeAtualId,
}) {
  const [atividadeId, setAtividadeId] = useState("");
  const [busca, setBusca] = useState("");
  const [tipoId, setTipoId] = useState("");
  const areasSelecionadas = new Set(selecionados.map((t) => t.areaSubmissao?.id).filter(Boolean));

  // Filtra por nome, dia/horário e local; a atividade já marcada continua
  // visível mesmo fora do filtro, pra não "sumir" a escolha feita.
  const tipos = [
    ...new Map(atividades.filter((a) => a.tipoAtividade).map((a) => [a.tipoAtividade.id, a.tipoAtividade])).values(),
  ].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const termo = normalizar(busca.trim());
  const filtrando = Boolean(termo || tipoId);
  // A atividade atual do trabalho (ao mover um só) não é opção.
  const candidatas = atividades.filter((atividade) => atividade.id !== atividadeAtualId);
  const visiveis = candidatas.filter(
    (atividade) =>
      atividade.id === atividadeId ||
      ((!tipoId || atividade.tipoAtividade?.id === tipoId) &&
        (!termo || normalizar(`${atividade.nome} ${detalheAtividade(atividade)}`).includes(termo)))
  );
  const sugeridas = visiveis.filter((atividade) => areasSelecionadas.has(atividade.areaSubmissaoId));
  const outras = visiveis.filter((atividade) => !areasSelecionadas.has(atividade.areaSubmissaoId));

  function grupo(titulo, lista) {
    if (lista.length === 0) return null;
    return (
      <fieldset className={estilos.grupoOpcoes}>
        <legend className={styles.rotuloBloco}>{titulo}</legend>
        {lista.map((atividade) => (
          <label key={atividade.id} className={estilos.opcaoAtividade}>
            <input
              type="radio"
              name="atividadeApresentacao"
              value={atividade.id}
              checked={atividadeId === atividade.id}
              onChange={() => setAtividadeId(atividade.id)}
            />
            <span>
              <span className={styles.nome}>{atividade.nome}</span>
              {atividade.tipoAtividade && <span className={styles.textoSuave}> · {atividade.tipoAtividade.nome}</span>}
              <span className={styles.textoSuave}>
                {" "}
                · {detalheAtividade(atividade)} · {atividade.totalTrabalhos}{" "}
                {atividade.totalTrabalhos === 1 ? "trabalho" : "trabalhos"}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
    );
  }

  return (
    <Modal titulo={titulo} onFechar={onFechar}>
      <div className={styles.formulario}>
        <p className={styles.textoApoio}>
          {descricao ||
            `${selecionados.length} ${selecionados.length === 1 ? "trabalho selecionado entra" : "trabalhos selecionados entram"} no fim da ordem da atividade escolhida, na ordem em que aparecem na tabela. Quem já estava em outra atividade é movido.`}
        </p>
        {atividades.length === 0 ? (
          <p className={styles.textoApoio}>Nenhuma atividade cadastrada nesta edição.</p>
        ) : (
          <>
            <div className={estilos.filtrosModal}>
              <CampoTexto
                id="buscaAtividadeVincular"
                rotulo="Buscar atividade (nome, dia ou local)"
                type="search"
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Ex.: Conversatório 7, 04/12, Auditório..."
              />
              {tipos.length > 1 && (
                <CampoSelecao
                  id="tipoAtividadeVincular"
                  rotulo="Tipo de atividade"
                  value={tipoId}
                  onChange={(evento) => setTipoId(evento.target.value)}
                >
                  <option value="">Todos os tipos</option>
                  {tipos.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </option>
                  ))}
                </CampoSelecao>
              )}
            </div>
            <p className={styles.textoApoio} aria-live="polite">
              {filtrando
                ? `${visiveis.length} de ${candidatas.length} atividades`
                : `${candidatas.length} atividades`}
            </p>
            {visiveis.length === 0 ? (
              <p className={styles.textoApoio}>Nenhuma atividade encontrada com esses filtros.</p>
            ) : (
              <div className={estilos.listaOpcoes}>
                {grupo("Sugeridas para a área", sugeridas)}
                {grupo(sugeridas.length ? "Outras atividades" : "Atividades", outras)}
              </div>
            )}
          </>
        )}
        <div className={styles.acoesFormulario}>
          <Botao type="button" variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao type="button" carregando={processando} disabled={!atividadeId} onClick={() => onConfirmar(atividadeId)}>
            Vincular
          </Botao>
        </div>
      </div>
    </Modal>
  );
}
