"use client";

import { useEffect, useRef } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import CampoMultiSelect from "./CampoMultiSelect";
import { opcoesDaColuna } from "./useTabela";
import styles from "./CabecalhoTabela.module.scss";

// <thead> das tabelas da área interna: cada coluna ganha ordenação (clique no
// rótulo: crescente → decrescente → sem ordem) e um filtro logo abaixo —
// multiselect para colunas de enum/catálogo fechado, texto para as demais. A coluna
// de ações (quando existe) não é ordenável nem filtrável.
//
// Com `selecao` (useSelecaoLinhas), ganha uma coluna inicial de checkbox que
// marca/desmarca todas as linhas visíveis — cada linha usa <CelulaSelecao>.
export default function CabecalhoTabela({ tabela, idTabela, comAcoes = true, classeAcoes, selecao }) {
  const { colunas, linhas, ordenacao, alternarOrdenacao, filtros, definirFiltro } = tabela;

  return (
    <thead className={styles.cabecalho}>
      <tr>
        {selecao && (
          <th className={styles.colunaSelecao}>
            <CaixaSelecao
              marcada={selecao.todosMarcados}
              indeterminada={selecao.algunsMarcados}
              onChange={selecao.alternarTodos}
              rotulo="Selecionar todas as linhas visíveis"
            />
          </th>
        )}
        {colunas.map((coluna) => {
          const direcao = ordenacao.chave === coluna.chave ? ordenacao.direcao : null;
          const idFiltro = `${idTabela}-filtro-${coluna.chave}`;
          const Icone = direcao === "asc" ? ArrowUp : direcao === "desc" ? ArrowDown : ArrowUpDown;

          return (
            <th
              key={coluna.chave}
              className={coluna.classe}
              aria-sort={direcao === "asc" ? "ascending" : direcao === "desc" ? "descending" : "none"}
            >
              <button
                type="button"
                className={`${styles.botaoOrdenar} ${direcao ? styles.botaoOrdenarAtivo : ""}`}
                onClick={() => alternarOrdenacao(coluna.chave)}
              >
                {coluna.rotulo}
                <Icone size={14} strokeWidth={1.5} aria-hidden="true" />
              </button>

              {coluna.filtro === "select" ? (
                <CampoMultiSelect
                  id={idFiltro}
                  compacto
                  aria-label={`Filtrar por ${coluna.rotulo}`}
                  value={filtros[coluna.chave] ?? []}
                  onChange={(valores) => definirFiltro(coluna.chave, valores)}
                  options={opcoesDaColuna(coluna, linhas)}
                  optionLabel="rotulo"
                  optionValue="valor"
                  placeholder="Todos"
                />
              ) : (
                <input
                  id={idFiltro}
                  type="search"
                  className={styles.filtro}
                  aria-label={`Filtrar por ${coluna.rotulo}`}
                  placeholder="Filtrar..."
                  value={filtros[coluna.chave] ?? ""}
                  onChange={(evento) => definirFiltro(coluna.chave, evento.target.value)}
                />
              )}
            </th>
          );
        })}
        {comAcoes && (
          <th className={`${classeAcoes || ""} ${styles.colunaAcoes}`}>
            <span className={styles.rotuloAcoes}>Ações</span>
          </th>
        )}
      </tr>
    </thead>
  );
}

function CaixaSelecao({ marcada, indeterminada = false, onChange, rotulo }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminada;
  }, [indeterminada]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className={styles.caixaSelecao}
      checked={marcada}
      onChange={onChange}
      aria-label={rotulo}
    />
  );
}

export function CelulaSelecao({ selecao, id, rotulo }) {
  return (
    <td className={styles.colunaSelecao} data-rotulo="Selecionar">
      <CaixaSelecao marcada={selecao.estaSelecionado(id)} onChange={() => selecao.alternar(id)} rotulo={rotulo} />
    </td>
  );
}

// Linha exibida no <tbody> quando os filtros não deixam nenhum resultado.
export function LinhaSemResultado({ tabela, colSpan }) {
  return (
    <tr className={styles.linhaSemResultado}>
      <td colSpan={colSpan}>
        Nenhum resultado para os filtros aplicados.{" "}
        <button type="button" className={styles.botaoLimpar} onClick={tabela.limparFiltros}>
          Limpar filtros
        </button>
      </td>
    </tr>
  );
}
