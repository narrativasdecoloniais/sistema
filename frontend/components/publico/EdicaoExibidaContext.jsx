"use client";

import { createContext, useContext, useState } from "react";

const EdicaoExibidaContext = createContext(null);

// BarraNavegacao é renderizada uma vez no layout — que só conhece a edição
// atual, nunca a edição específica de uma página como /edicoes/[slug]. Esse
// contexto deixa uma página informar "estou mostrando a edição X" pro selo
// da navbar refletir isso, com a edição atual como padrão pra todo o resto
// (home, /atividades/[slug], /inscricao etc., que já era o comportamento
// correto antes).
export function EdicaoExibidaProvider({ numeroEdicaoPadrao, children }) {
  const [numeroEdicao, setNumeroEdicao] = useState(numeroEdicaoPadrao);

  return (
    <EdicaoExibidaContext.Provider value={{ numeroEdicao, numeroEdicaoPadrao, setNumeroEdicao }}>
      {children}
    </EdicaoExibidaContext.Provider>
  );
}

export function useEdicaoExibida() {
  return useContext(EdicaoExibidaContext);
}
