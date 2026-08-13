"use client";

import { useRef } from "react";
import { formatarDiaAtividade } from "@/lib/publico";
import styles from "./SeletorDiaProgramacao.module.scss";

export default function SeletorDiaProgramacao({ dias, chaveAtiva, onSelecionar }) {
  const refsAbas = useRef([]);

  function aoTeclar(evento, index) {
    const mapa = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: dias.length - 1,
    };
    const alvo = mapa[evento.key];
    if (alvo === undefined) return;

    evento.preventDefault();
    const proximo = (alvo + dias.length) % dias.length;
    onSelecionar(dias[proximo].chave);
    refsAbas.current[proximo]?.focus();
  }

  return (
    <div className={styles.abas} role="tablist" aria-label="Dias com atividades">
      {dias.map((dia, index) => {
        const { diaSemana, dataCurta, completo } = formatarDiaAtividade(dia.inicioIso);
        const ativo = dia.chave === chaveAtiva;

        return (
          <button
            key={dia.chave}
            ref={(no) => (refsAbas.current[index] = no)}
            type="button"
            role="tab"
            aria-selected={ativo}
            aria-label={completo}
            tabIndex={ativo ? 0 : -1}
            className={`${styles.aba} ${ativo ? styles.abaAtiva : ""}`}
            onClick={() => onSelecionar(dia.chave)}
            onKeyDown={(evento) => aoTeclar(evento, index)}
          >
            <span className={styles.diaSemana}>{diaSemana}</span>
            <span className={styles.dataCurta}>{dataCurta}</span>
          </button>
        );
      })}
    </div>
  );
}
