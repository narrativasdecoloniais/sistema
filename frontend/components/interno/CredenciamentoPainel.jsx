"use client";

import { useState } from "react";
import CredenciamentoEventoAba from "./CredenciamentoEventoAba";
import CredenciamentoAtividadesAba from "./CredenciamentoAtividadesAba";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";

// Tela de credenciamento da equipe (seção CREDENCIAMENTO): credenciamento
// geral no evento e presença nas atividades que exigem inscrição, com os QR
// codes de autocredenciamento (credenciamento.service.js).
export default function CredenciamentoPainel({ edicaoId, dadosIniciais }) {
  const [abaAtiva, setAbaAtiva] = useState("evento");

  if (!dadosIniciais) {
    return (
      <div className={styles.vazio}>
        <p>Não foi possível carregar o credenciamento.</p>
        <p className={styles.vazioApoio}>Recarregue a página para tentar de novo.</p>
      </div>
    );
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Credenciamento</h1>
          <p className={styles.descricao}>
            Credencie participantes no evento e registre a presença nas atividades — pela busca aqui ou pelos QR
            codes, que cada pessoa lê em Credenciamento, na área do participante.
          </p>
        </div>
      </div>

      <div className={styles.abas} role="tablist" aria-label="Seções do credenciamento">
        {[
          { chave: "evento", rotulo: "Evento" },
          { chave: "atividades", rotulo: "Atividades" },
        ].map((aba) => (
          <button
            key={aba.chave}
            type="button"
            role="tab"
            aria-selected={abaAtiva === aba.chave}
            tabIndex={abaAtiva === aba.chave ? 0 : -1}
            className={`${styles.aba} ${abaAtiva === aba.chave ? styles.abaAtiva : ""}`}
            onClick={() => setAbaAtiva(aba.chave)}
          >
            {aba.rotulo}
          </button>
        ))}
      </div>

      {abaAtiva === "evento" ? (
        <CredenciamentoEventoAba edicaoId={edicaoId} dadosIniciais={dadosIniciais} />
      ) : (
        <CredenciamentoAtividadesAba
          edicaoId={edicaoId}
          edicao={dadosIniciais.edicao}
          atividadesIniciais={dadosIniciais.atividades}
        />
      )}
    </div>
  );
}
