"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useReducedMotion } from "@/lib/useReducedMotion";

// Wiring compartilhado por qualquer carrossel Embla do fluxo de inscrição:
// duration por prefers-reduced-motion, contagem prev/next/total, e
// sincronização de foco em slide fora da tela (Tab até um elemento focável
// num slide não visível faz o browser rolar nativamente o viewport,
// dessincronizando do transform do Embla — o listener de focusin realinha o
// carrossel; o de scroll é salvaguarda, já que a ordem dos dois eventos não
// é consistente entre engines).
export function useCarrosselEmbla(opcoesEmbla = {}) {
  const reduzirMovimento = useReducedMotion();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    loop: false,
    duration: reduzirMovimento ? 0 : 25,
    ...opcoesEmbla,
  });

  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);
  const [indice, setIndice] = useState(0);
  const [total, setTotal] = useState(0);

  const atualizar = useCallback((api) => {
    setPodeVoltar(api.canScrollPrev());
    setPodeAvancar(api.canScrollNext());
    setIndice(api.selectedScrollSnap());
    setTotal(api.scrollSnapList().length);
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit({ duration: reduzirMovimento ? 0 : 25 });
  }, [emblaApi, reduzirMovimento]);

  useEffect(() => {
    if (!emblaApi) return;
    atualizar(emblaApi);
    emblaApi.on("reInit", atualizar).on("select", atualizar);
    return () => {
      emblaApi.off("reInit", atualizar).off("select", atualizar);
    };
  }, [emblaApi, atualizar]);

  useEffect(() => {
    if (!emblaApi) return;
    const raiz = emblaApi.rootNode();

    function aoFocar(evento) {
      const indiceAlvo = emblaApi.slideNodes().findIndex((slide) => slide.contains(evento.target));
      if (indiceAlvo >= 0) emblaApi.scrollTo(indiceAlvo);
    }

    function fixarRolagem() {
      if (raiz.scrollLeft !== 0) raiz.scrollLeft = 0;
    }

    raiz.addEventListener("focusin", aoFocar);
    raiz.addEventListener("scroll", fixarRolagem);
    return () => {
      raiz.removeEventListener("focusin", aoFocar);
      raiz.removeEventListener("scroll", fixarRolagem);
    };
  }, [emblaApi]);

  return { emblaRef, emblaApi, podeVoltar, podeAvancar, indice, total };
}
