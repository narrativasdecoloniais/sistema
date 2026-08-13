"use client";

import { useEffect } from "react";
import { useEdicaoExibida } from "./EdicaoExibidaContext";

// Sem corpo visual — só avisa o contexto (e portanto o selo da navbar) qual
// edição a página atual está mostrando. Desfaz ao desmontar (navegar pra
// outra página) pra não deixar o selo "preso" na edição errada.
export default function DefinirEdicaoExibida({ numero }) {
  const contexto = useEdicaoExibida();

  useEffect(() => {
    if (!contexto) return undefined;
    contexto.setNumeroEdicao(numero ?? contexto.numeroEdicaoPadrao);
    return () => contexto.setNumeroEdicao(contexto.numeroEdicaoPadrao);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numero]);

  return null;
}
