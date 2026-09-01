"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { paraNumeroRomano } from "@/lib/romanos";
import { formatarPeriodoEdicao } from "@/lib/publico";
import { listarEdicoesInscricoes } from "@/lib/participanteInscricoes";
import styles from "./InscricoesParticipantePainel.module.scss";

export default function InscricoesParticipantePainel() {
  const [inscricoes, setInscricoes] = useState(null);

  useEffect(() => {
    let cancelado = false;
    listarEdicoesInscricoes()
      .then((dados) => {
        if (!cancelado) setInscricoes(dados);
      })
      .catch(() => {
        if (!cancelado) setInscricoes([]);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Minhas inscrições</h1>
          <p className={styles.descricao}>
            Edições com inscrições abertas no momento, e edições em que você já está inscrito.
          </p>
        </div>
      </div>

      {inscricoes === null ? (
        <div className={styles.vazio}>
          <p>Carregando...</p>
        </div>
      ) : inscricoes.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhuma edição com inscrições abertas no momento.</p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Edição</th>
                <th>Período de inscrição</th>
                <th>Status</th>
                <th className={styles.colunaAcoes}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {inscricoes.map(({ edicao, aberta, jaInscrito }) => (
                <tr key={edicao.id}>
                  <td data-rotulo="Edição">
                    {paraNumeroRomano(edicao.numero)} — {edicao.nome}
                  </td>
                  <td data-rotulo="Período de inscrição">
                    {formatarPeriodoEdicao(edicao.inicioInscricoes, edicao.fimInscricoes)}
                  </td>
                  <td data-rotulo="Status">
                    <div className={styles.tags}>
                      {jaInscrito && <span className={`${styles.tag} ${styles.tagInscrito}`}>Inscrito</span>}
                      <span className={`${styles.tag} ${aberta ? styles.tagAberta : styles.tagEncerrada}`}>
                        {aberta ? "Aberta" : "Encerrada"}
                      </span>
                    </div>
                  </td>
                  <td data-rotulo="Ação" className={styles.colunaAcoes}>
                    <Link href={`/participante/inscricoes/${edicao.id}`} className={styles.link}>
                      {jaInscrito ? "Ver inscrição" : "Inscrever-se"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
