"use client";

import Modal from "./Modal";
import { formatarDiaAtividade, formatarFaixaHorario } from "@/lib/publico";
import styles from "./DetalhesAtividadeModal.module.scss";

export default function DetalhesAtividadeModal({ atividade, onFechar }) {
  const mesmoDia =
    new Date(atividade.inicioAtividade).toISOString().slice(0, 10) ===
    new Date(atividade.fimAtividade).toISOString().slice(0, 10);
  const rotuloDia = mesmoDia
    ? formatarDiaAtividade(atividade.inicioAtividade).completo
    : `${formatarDiaAtividade(atividade.inicioAtividade).completo} até ${formatarDiaAtividade(atividade.fimAtividade).completo}`;

  const meta = [atividade.local, atividade.cargaHoraria ? `${atividade.cargaHoraria}h` : null]
    .filter(Boolean)
    .join(" · ");

  const estadoVagas = atividade.semLimiteVagas
    ? "Vagas ilimitadas"
    : atividade.lotada
      ? "Lotada — você entrará na lista de espera"
      : `${atividade.vagasRestantes} vaga(s) restante(s)`;

  return (
    <Modal titulo={atividade.nome} onFechar={onFechar}>
      <div className={styles.corpo}>
        <p className={styles.eyebrow}>{atividade.tipoAtividade.nome}</p>
        <p className={styles.linha}>{rotuloDia}</p>
        <p className={styles.linha}>{formatarFaixaHorario(atividade.inicioAtividade, atividade.fimAtividade)}</p>
        {meta && <p className={styles.linha}>{meta}</p>}
        <p className={styles.vagas}>{estadoVagas}</p>
        {atividade.descricao && <p className={styles.descricao}>{atividade.descricao}</p>}
      </div>
    </Modal>
  );
}
