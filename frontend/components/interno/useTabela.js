"use client";

import { useMemo, useState } from "react";

// Ordenação e filtro client-side das tabelas da área interna.
//
// Cada coluna é descrita por:
//   chave    — identificador único na tabela
//   rotulo   — texto do cabeçalho
//   valor    — (linha) => string | number | null; usado na ordenação
//   texto    — (linha) => string; alvo do filtro de texto (padrão: String(valor))
//   filtro   — "texto" (padrão) ou "select" (colunas vindas de enum/catálogo
//              fechado; multiseleção — a linha passa se casar com qualquer
//              um dos valores marcados)
//   opcoes   — [{ valor, rotulo }] do select; sem isso, derivadas dos valores distintos
//   corresponde — (linha, valorSelecionado) => boolean; filtro de select customizado,
//                 chamado uma vez por valor marcado
//                 (padrão: compara com `valor(linha)`)
//   exportar — (linha) => string | number; valor na planilha exportada
//              (padrão: `texto`, se houver, senão `valor`)
//   classe   — className extra aplicada ao <th>

export function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const colador = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });

function comparar(a, b) {
  const aVazio = a === null || a === undefined || a === "";
  const bVazio = b === null || b === undefined || b === "";
  // Vazios sempre no fim, independente da direção.
  if (aVazio || bVazio) return aVazio === bVazio ? 0 : aVazio ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return colador.compare(String(a), String(b));
}

// Texto: string não vazia. Select: array com pelo menos um valor marcado.
function filtroAtivo(termo) {
  if (Array.isArray(termo)) return termo.length > 0;
  return termo !== undefined && termo !== "";
}

export function valorExportado(coluna, linha) {
  const valor = coluna.exportar
    ? coluna.exportar(linha)
    : coluna.texto
      ? coluna.texto(linha)
      : coluna.valor(linha);
  return valor === null || valor === undefined ? "" : valor;
}

export function opcoesDaColuna(coluna, linhas) {
  if (coluna.opcoes) return coluna.opcoes;

  const distintos = new Set();
  linhas.forEach((linha) => {
    const valor = coluna.valor(linha);
    if (valor !== null && valor !== undefined && valor !== "") distintos.add(valor);
  });
  return [...distintos].sort(comparar).map((valor) => ({ valor, rotulo: String(valor) }));
}

export default function useTabela(linhas, colunas) {
  const [ordenacao, setOrdenacao] = useState({ chave: null, direcao: null });
  const [filtros, setFiltros] = useState({});

  function alternarOrdenacao(chave) {
    setOrdenacao((atual) => {
      if (atual.chave !== chave) return { chave, direcao: "asc" };
      if (atual.direcao === "asc") return { chave, direcao: "desc" };
      return { chave: null, direcao: null };
    });
  }

  function definirFiltro(chave, valor) {
    setFiltros((atual) => ({ ...atual, [chave]: valor }));
  }

  function limparFiltros() {
    setFiltros({});
  }

  const linhasVisiveis = useMemo(() => {
    const ativos = colunas
      .map((coluna) => ({ coluna, termo: filtros[coluna.chave] }))
      .filter(({ termo }) => filtroAtivo(termo));

    let resultado = linhas.filter((linha) =>
      ativos.every(({ coluna, termo }) => {
        if (coluna.filtro === "select") {
          return termo.some((selecionado) =>
            coluna.corresponde
              ? coluna.corresponde(linha, selecionado)
              : String(coluna.valor(linha)) === String(selecionado)
          );
        }
        const alvo = coluna.texto ? coluna.texto(linha) : coluna.valor(linha);
        return normalizarTexto(alvo).includes(normalizarTexto(termo.trim()));
      })
    );

    const colunaOrdenada = colunas.find((coluna) => coluna.chave === ordenacao.chave);
    if (colunaOrdenada) {
      const fator = ordenacao.direcao === "desc" ? -1 : 1;
      resultado = [...resultado].sort((a, b) => {
        const va = colunaOrdenada.valor(a);
        const vb = colunaOrdenada.valor(b);
        const vazio = (v) => v === null || v === undefined || v === "";
        // Mantém vazios no fim também na ordem decrescente.
        if (vazio(va) || vazio(vb)) return comparar(va, vb);
        return comparar(va, vb) * fator;
      });
    }

    return resultado;
  }, [linhas, colunas, filtros, ordenacao]);

  const temFiltroAtivo = Object.values(filtros).some(filtroAtivo);

  return {
    colunas,
    linhas,
    linhasVisiveis,
    ordenacao,
    alternarOrdenacao,
    filtros,
    definirFiltro,
    limparFiltros,
    temFiltroAtivo,
  };
}
