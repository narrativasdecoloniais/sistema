"use client";

import { useEffect, useState } from "react";

// Inicial false (não true) evita mismatch de hidratação — a correção no
// useEffect roda antes de qualquer animação começar, então é imperceptível.
export function useReducedMotion() {
  const [reduzir, setReduzir] = useState(false);

  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduzir(consulta.matches);

    function aoMudar(evento) {
      setReduzir(evento.matches);
    }

    consulta.addEventListener("change", aoMudar);
    return () => consulta.removeEventListener("change", aoMudar);
  }, []);

  return reduzir;
}
