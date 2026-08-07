"use client";

import { useState } from "react";
import { formatarFaixaHorario } from "@/lib/publico";
import ModalDetalhesAtividade from "./ModalDetalhesAtividade";
import styles from "./AtividadeSelecionavel.module.scss";

export default function AtividadeSelecionavel({ atividade, selecionada, onChange, conflito }) {
  const [modalAberto, setModalAberto] = useState(false);
  const jaInscrito = Boolean(atividade.statusInscricaoAtual);
  const desabilitado = jaInscrito;

  function aoAbrirDetalhes(evento) {
    evento.preventDefault();
    evento.stopPropagation();
    setModalAberto(true);
  }

  const estadoVagas = atividade.semLimiteVagas
    ? "Vagas ilimitadas"
    : atividade.lotada
      ? "Lotada — você entrará na lista de espera"
      : `${atividade.vagasRestantes} vagas restantes`;

  return (
    <>
      <label
        className={`${styles.cartao} ${selecionada ? styles.selecionado : ""} ${desabilitado ? styles.desabilitado : ""} ${conflito && !desabilitado ? styles.conflitante : ""}`}
      >
        <input
          type="checkbox"
          className={styles.input}
          checked={selecionada}
          disabled={desabilitado}
          onChange={(evento) => onChange(evento.target.checked)}
        />
        <div className={styles.conteudo}>
          <div className={styles.cabecalho}>
            <span className={styles.tipo}>{atividade.tipoAtividade.nome}</span>
            <span className={styles.nome}>{atividade.nome}</span>
          </div>
          <p className={styles.periodo}>
            {formatarFaixaHorario(atividade.inicioAtividade, atividade.fimAtividade)}
          </p>
          <p className={`${styles.vagas} ${atividade.lotada ? styles.vagasLotada : ""}`}>
            {estadoVagas}
          </p>
          {jaInscrito && (
            <p className={styles.badge}>
              {atividade.statusInscricaoAtual === "CONFIRMADA"
                ? "Você já está confirmado(a)"
                : "Você já está na lista de espera"}
            </p>
          )}
          {conflito && !desabilitado && (
            <p className={styles.aviso}>Conflita com outra atividade selecionada.</p>
          )}
          <button type="button" className={styles.detalhes} onClick={aoAbrirDetalhes}>
            Ver detalhes
          </button>
        </div>
      </label>
      {modalAberto && (
        <ModalDetalhesAtividade atividade={atividade} aoFechar={() => setModalAberto(false)} />
      )}
    </>
  );
}
