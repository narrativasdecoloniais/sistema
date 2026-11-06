"use client";

import { useCallback, useState } from "react";
import ModalResumoTrabalho from "./ModalResumoTrabalho";
import styles from "./TrabalhosDaAtividade.module.scss";

// Trabalhos apresentados na atividade — só chega preenchido depois que a
// distribuição é publicada (backend). Numerados só quando a edição divulga a
// ordem de apresentação; senão o backend manda ordemApresentacao nula e a
// lista por título (utils/ordemApresentacao.js), e aqui some o número.
export default function TrabalhosDaAtividade({ trabalhos }) {
  const [aberto, setAberto] = useState(null);
  const fechar = useCallback(() => setAberto(null), []);

  return (
    <>
      <ol className={styles.lista}>
        {trabalhos.map((trabalho, indice) => (
          <li key={trabalho.id}>
            <button type="button" className={styles.cartao} onClick={() => setAberto(trabalho)}>
              {trabalho.ordemApresentacao != null && (
                <span className={styles.posicao} aria-hidden="true">
                  {indice + 1}
                </span>
              )}
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
