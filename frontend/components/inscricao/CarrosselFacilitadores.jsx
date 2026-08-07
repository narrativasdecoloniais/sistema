"use client";

import { useCarrosselEmbla } from "./useCarrosselEmbla";
import styles from "./CarrosselFacilitadores.module.scss";

export default function CarrosselFacilitadores({ children }) {
  const { emblaRef, emblaApi, podeVoltar, podeAvancar, indice, total } = useCarrosselEmbla();

  const cartoes = Array.isArray(children) ? children : [children];

  return (
    <div className={styles.carrossel}>
      <div className={styles.viewport} ref={emblaRef}>
        <div className={styles.container}>
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
          aria-label="Pessoa anterior"
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
          aria-label="Próxima pessoa"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  );
}
