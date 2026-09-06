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
        <div className={styles.grade}>
          {inscricoes.map(({ edicao, aberta, jaInscrito }) => (
            <article key={edicao.id} className={styles.cartao}>
              <div className={styles.cartaoCabecalho}>
                <h3 className={styles.cartaoTitulo}>
                  {paraNumeroRomano(edicao.numero)} — {edicao.nome}
                </h3>
                <div className={styles.tags}>
                  {jaInscrito && <span className={`${styles.tag} ${styles.tagInscrito}`}>Inscrito</span>}
                  <span className={`${styles.tag} ${aberta ? styles.tagAberta : styles.tagEncerrada}`}>
                    {aberta ? "Aberta" : "Encerrada"}
                  </span>
                </div>
              </div>
              <p className={styles.cartaoMeta}>
                {formatarPeriodoEdicao(edicao.inicioInscricoes, edicao.fimInscricoes)}
              </p>
              <Link href={`/participante/inscricoes/${edicao.id}`} className={styles.cartaoAcao}>
                {jaInscrito ? "Ver inscrição" : "Inscrever-se"} <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
