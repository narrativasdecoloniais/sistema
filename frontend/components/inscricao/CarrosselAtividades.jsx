"use client";

import { useId } from "react";
import { useCarrosselEmbla } from "./useCarrosselEmbla";
import styles from "./CarrosselAtividades.module.scss";

export default function CarrosselAtividades({ children, rotulo, estiloSlide }) {
  const idRotulo = useId();
  const { emblaRef, emblaApi, podeVoltar, podeAvancar, indice, total } = useCarrosselEmbla();

  const cartoes = Array.isArray(children) ? children : [children];

  return (
    <div className={styles.carrossel}>
      <p className={styles.rotulo} id={idRotulo}>
        {rotulo}
      </p>

      <div className={styles.viewport} ref={emblaRef} aria-labelledby={idRotulo}>
        <div className={styles.container} style={estiloSlide}>
          {cartoes.map((cartao) => (
            <div className={styles.slide} key={cartao.key}>
              {cartao}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.controles}>
        <button
          type="button"
          className={styles.controle}
          onClick={() => emblaApi?.scrollPrev()}
          disabled={!podeVoltar}
          aria-label="Atividade anterior"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <p className={styles.contador} aria-live="polite">
          {indice + 1} de {total}
        </p>
        <button
          type="button"
          className={styles.controle}
          onClick={() => emblaApi?.scrollNext()}
          disabled={!podeAvancar}
          aria-label="Próxima atividade"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  );
}
