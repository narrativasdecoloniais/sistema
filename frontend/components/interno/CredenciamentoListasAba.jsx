"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import Botao from "@/components/forms/Botao";
import { useToast } from "./ToastProvider";
import { credenciamentoAdmin } from "@/lib/credenciamento";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./CredenciamentoPainel.module.scss";

// Listas de presença em PDF para imprimir antes do evento: contingência para
// quando o sistema ou a internet caírem. O que for assinado no papel é lançado
// depois em lote (Credenciados e lista de presença de cada atividade).
export default function CredenciamentoListasAba({ edicaoId, temAtividades }) {
  const { notificar } = useToast();
  const [baixando, setBaixando] = useState(null);

  async function baixar(chave, acao) {
    setBaixando(chave);
    try {
      await acao();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setBaixando(null);
    }
  }

  return (
    <>
      <p className={`${styles.textoApoio} ${estilos.textoListas}`}>
        Se a internet ou o sistema ficarem fora do ar no dia, a equipe segue com as listas em papel. Baixe e imprima
        na véspera e de novo pouco antes de abrir o credenciamento: cada lista mostra quem já estava registrado no
        momento em que foi gerada. Os documentos saem mascarados, porque o papel fica exposto na mesa.
      </p>

      <section className={estilos.secaoQr} aria-labelledby="lista-evento">
        <h2 id="lista-evento" className={estilos.subtitulo}>
          Credenciamento no evento
        </h2>
        <p className={styles.textoApoio}>
          Todos os inscritos em ordem alfabética, com espaço para assinatura e linhas em branco no fim para quem
          chegar sem inscrição.
        </p>
        <div>
          <Botao
            type="button"
            variante="secundario"
            carregando={baixando === "evento"}
            onClick={() => baixar("evento", () => credenciamentoAdmin.baixarListaEvento(edicaoId))}
          >
            <FileDown size={18} strokeWidth={1.5} aria-hidden="true" />
            Baixar lista do evento
          </Botao>
        </div>
      </section>

      {temAtividades && (
        <section className={estilos.secaoQr} aria-labelledby="listas-atividades">
          <h2 id="listas-atividades" className={estilos.subtitulo}>
            Presença nas atividades
          </h2>
          <p className={styles.textoApoio}>
            Um arquivo com a lista de cada atividade com inscrição, cada uma começando numa página nova: confirmados,
            lista de espera e linhas em branco. A lista de uma atividade só fica na lista de presença dela, em
            Atividades.
          </p>
          <div>
            <Botao
              type="button"
              variante="secundario"
              carregando={baixando === "atividades"}
              onClick={() => baixar("atividades", () => credenciamentoAdmin.baixarListasAtividades(edicaoId))}
            >
              <FileDown size={18} strokeWidth={1.5} aria-hidden="true" />
              Baixar listas de todas as atividades
            </Botao>
          </div>
        </section>
      )}

      <section className={estilos.secaoQr} aria-labelledby="lancar-listas">
        <h2 id="lancar-listas" className={estilos.subtitulo}>
          Depois: lançar o que foi assinado
        </h2>
        <p className={styles.textoApoio}>
          Os certificados dependem do registro no sistema. Em Credenciados, marque quem assinou a lista do evento e use
          “Credenciar selecionados”; na lista de presença de cada atividade, “Registrar presença dos selecionados”.
          Quem assinou nas linhas em branco é registrado pela busca, na aba Credenciar ou na lista de presença.
        </p>
      </section>
    </>
  );
}
