"use client";

import { useCallback, useState } from "react";
import ModalResumoTrabalho from "./ModalResumoTrabalho";
import styles from "./TrabalhosDaAtividade.module.scss";

// Trabalhos apresentados na atividade, na ordem definida pela organização —
// só chega preenchido depois que a distribuição é publicada (backend).
export default function TrabalhosDaAtividade({ trabalhos }) {
  const [aberto, setAberto] = useState(null);
  const fechar = useCallback(() => setAberto(null), []);

  return (
    <>
      <ol className={styles.lista}>
        {trabalhos.map((trabalho, indice) => (
          <li key={trabalho.id}>
            <button type="button" className={styles.cartao} onClick={() => setAberto(trabalho)}>
              <span className={styles.posicao} aria-hidden="true">
                {indice + 1}
              </span>
              <span className={styles.texto}>
                <span className={styles.titulo}>{trabalho.titulo}</span>
                <span className={styles.autores}>{trabalho.autores.map((autor) => autor.nome).join(", ")}</span>
                <span className={styles.acao}>Ler resumo →</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      {aberto && <ModalResumoTrabalho trabalho={aberto} aoFechar={fechar} />}
    </>
  );
}
