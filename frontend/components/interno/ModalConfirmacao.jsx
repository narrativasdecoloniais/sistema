"use client";

import Modal from "./Modal";
import Botao from "@/components/forms/Botao";
import styles from "./ModalConfirmacao.module.scss";

export default function ModalConfirmacao({
  titulo,
  mensagem,
  rotuloConfirmar = "Confirmar",
  perigo = true,
  confirmando = false,
  onConfirmar,
  onCancelar,
}) {
  return (
    <Modal titulo={titulo} onFechar={onCancelar}>
      <div className={styles.corpo}>
        {mensagem && <p className={styles.mensagem}>{mensagem}</p>}
        <div className={styles.acoes}>
          <Botao type="button" variante="secundario" onClick={onCancelar}>
            Cancelar
          </Botao>
          <Botao
            type="button"
            variante={perigo ? "perigo" : "primario"}
            carregando={confirmando}
            onClick={onConfirmar}
          >
            {rotuloConfirmar}
          </Botao>
        </div>
      </div>
    </Modal>
  );
}
