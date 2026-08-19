"use client";

import { useEffect } from "react";
import { useEdicaoExibida } from "./EdicaoExibidaContext";

// Sem corpo visual — só avisa o contexto (e portanto o selo e as cores da
// navbar) qual edição a página atual está mostrando. Desfaz ao desmontar
// (navegar pra outra página) pra não deixar o selo/cores "presos" na edição
// errada.
export default function DefinirEdicaoExibida({ numero, navegacao }) {
  const contexto = useEdicaoExibida();

  useEffect(() => {
    if (!contexto) return undefined;
    contexto.setNumeroEdicao(numero ?? contexto.numeroEdicaoPadrao);
    contexto.setNavegacao(navegacao ?? contexto.navegacaoPadrao);
    return () => {
      contexto.setNumeroEdicao(contexto.numeroEdicaoPadrao);
      contexto.setNavegacao(contexto.navegacaoPadrao);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numero, navegacao]);

  return null;
}
