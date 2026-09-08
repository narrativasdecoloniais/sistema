"use client";

import { useState } from "react";
import Modal from "./Modal";
import Campo from "@/components/forms/Campo";
import Botao from "@/components/forms/Botao";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { paraData, paraHora, combinar } from "@/lib/dataHoraIngenua";
import styles from "./ModalDuplicarAtividade.module.scss";

export default function ModalDuplicarAtividade({ edicaoId, atividade, onCancelar, onDuplicar }) {
  const [inicioAtividade, setInicioAtividade] = useState(atividade.inicioAtividade || "");
  const [fimAtividade, setFimAtividade] = useState(atividade.fimAtividade || "");
  const [erroGeral, setErroGeral] = useState("");
  const [duplicando, setDuplicando] = useState(false);

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");
    setDuplicando(true);

    try {
      const resposta = await apiClient.post(`/edicoes/${edicaoId}/atividades/${atividade.id}/duplicar`, {
        inicioAtividade,
        fimAtividade,
      });
      onDuplicar(resposta.atividade);
    } catch (erro) {
      setErroGeral(erro.message);
    } finally {
      setDuplicando(false);
    }
  }

  return (
    <Modal titulo="Duplicar atividade" onFechar={onCancelar}>
      <form onSubmit={aoSubmeter} className={styles.formulario}>
        <Alerta>{erroGeral}</Alerta>
        <p className={styles.descricao}>
          Cria uma cópia de <strong>{atividade.nome}</strong> com as mesmas pessoas envolvidas e
          fotos — só informe a data e o horário do novo dia.
        </p>
        <div className={styles.linha}>
          <Campo
            id="duplicar-data-inicio"
            rotulo="Início da atividade"
            type="date"
            required
            value={paraData(inicioAtividade)}
            onChange={(evento) => setInicioAtividade((atual) => combinar(atual, { data: evento.target.value }))}
          />
          <Campo
            id="duplicar-hora-inicio"
            rotulo="Hora"
            type="time"
            required
            value={paraHora(inicioAtividade)}
            onChange={(evento) => setInicioAtividade((atual) => combinar(atual, { hora: evento.target.value }))}
          />
        </div>
        <div className={styles.linha}>
          <Campo
            id="duplicar-data-fim"
            rotulo="Fim da atividade"
            type="date"
            required
            value={paraData(fimAtividade)}
            onChange={(evento) => setFimAtividade((atual) => combinar(atual, { data: evento.target.value }))}
          />
          <Campo
            id="duplicar-hora-fim"
            rotulo="Hora"
            type="time"
            required
            value={paraHora(fimAtividade)}
            onChange={(evento) => setFimAtividade((atual) => combinar(atual, { hora: evento.target.value }))}
          />
        </div>
        <div className={styles.acoes}>
          <Botao type="button" variante="secundario" onClick={onCancelar}>
            Cancelar
          </Botao>
          <Botao type="submit" carregando={duplicando}>
            Duplicar
          </Botao>
        </div>
      </form>
    </Modal>
  );
}
