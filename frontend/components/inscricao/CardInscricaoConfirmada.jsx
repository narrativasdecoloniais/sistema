"use client";

import { useState } from "react";
import { formatarPeriodoAtividade, formatarPeriodoEdicao } from "@/lib/publico";
import styles from "./CardInscricaoConfirmada.module.scss";

// Card grande = inscrição geral no evento (edição); card aninhado = as
// inscrições em atividades específicas dentro dela. Usado tanto no meio do
// fluxo (lembrete do que já está confirmado antes de escolher mais
// atividades) quanto na tela final de confirmação. Quando `onCancelar` é
// passado, cada atividade ganha um cancelamento com confirmação inline (o
// site público não tem um padrão de modal de confirmação como o
// ModalConfirmacao do admin — aqui o próprio item da lista vira o
// "confirma?" por um instante).
export default function CardInscricaoConfirmada({
  titulo = "Sua inscrição",
  edicao,
  inscricoesAtividade = [],
  onCancelar,
}) {
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [cancelandoId, setCancelandoId] = useState(null);

  const confirmadas = inscricoesAtividade.filter((item) => item.status === "CONFIRMADA");
  const listaEspera = inscricoesAtividade.filter((item) => item.status === "LISTA_ESPERA");

  async function aoConfirmarCancelamento(item) {
    setCancelandoId(item.id);
    try {
      await onCancelar(item);
    } finally {
      setCancelandoId(null);
      setConfirmandoId(null);
    }
  }

  function renderizarItem(item) {
    const emConfirmacao = confirmandoId === item.id;
    const cancelando = cancelandoId === item.id;

    return (
      <li key={item.id}>
        <strong>{item.atividade.nome}</strong>
        <br />
        {formatarPeriodoAtividade(item.atividade.inicioAtividade, item.atividade.fimAtividade)}

        {onCancelar &&
          (emConfirmacao ? (
            <div className={styles.confirmacao}>
              <span>Cancelar sua inscrição nessa atividade?</span>
              <button
                type="button"
                className={styles.confirmar}
                disabled={cancelando}
                onClick={() => aoConfirmarCancelamento(item)}
              >
                {cancelando ? "Cancelando..." : "Sim, cancelar"}
              </button>
              <button
                type="button"
                className={styles.negar}
                disabled={cancelando}
                onClick={() => setConfirmandoId(null)}
              >
                Não
              </button>
            </div>
          ) : (
            <button type="button" className={styles.cancelar} onClick={() => setConfirmandoId(item.id)}>
              Cancelar inscrição
            </button>
          ))}
      </li>
    );
  }

  return (
    <div className={styles.cartao}>
      <p className={styles.eyebrow}>{titulo}</p>
      <p className={styles.nomeEdicao}>{edicao?.nome}</p>
      {edicao && (
        <p className={styles.periodo}>{formatarPeriodoEdicao(edicao.dataInicio, edicao.dataFim)}</p>
      )}

      <div className={styles.atividades}>
        <p className={styles.subtitulo}>Atividades específicas</p>

        {inscricoesAtividade.length === 0 && (
          <p className={styles.vazio}>Nenhuma atividade específica selecionada ainda.</p>
        )}

        {confirmadas.length > 0 && <ul className={styles.lista}>{confirmadas.map(renderizarItem)}</ul>}

        {listaEspera.length > 0 && (
          <>
            <p className={styles.subtituloEspera}>Lista de espera</p>
            <ul className={styles.lista}>{listaEspera.map(renderizarItem)}</ul>
          </>
        )}
      </div>
    </div>
  );
}
