"use client";

import { useEffect, useMemo, useState } from "react";

// Seleção de linhas (checkbox) de uma tabela com useTabela. Só linhas
// visíveis podem ficar selecionadas: ao mudar filtros, o que saiu de vista é
// desmarcado — assim uma ação em lote nunca atinge algo que o gestor não vê.
export default function useSelecaoLinhas(tabela, obterId = (linha) => linha.id) {
  const [selecionados, setSelecionados] = useState(() => new Set());
  const { linhasVisiveis } = tabela;

  const idsVisiveis = useMemo(() => linhasVisiveis.map(obterId), [linhasVisiveis, obterId]);

  useEffect(() => {
    setSelecionados((atual) => {
      const visiveis = new Set(idsVisiveis);
      const filtrado = new Set([...atual].filter((id) => visiveis.has(id)));
      return filtrado.size === atual.size ? atual : filtrado;
    });
  }, [idsVisiveis]);

  function alternar(id) {
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  const todosMarcados = idsVisiveis.length > 0 && idsVisiveis.every((id) => selecionados.has(id));
  const algunsMarcados = !todosMarcados && idsVisiveis.some((id) => selecionados.has(id));

  function alternarTodos() {
    setSelecionados(todosMarcados ? new Set() : new Set(idsVisiveis));
  }

  function limpar() {
    setSelecionados(new Set());
  }

  return {
    selecionados,
    quantidade: selecionados.size,
    estaSelecionado: (id) => selecionados.has(id),
    alternar,
    alternarTodos,
    todosMarcados,
    algunsMarcados,
    limpar,
  };
}
