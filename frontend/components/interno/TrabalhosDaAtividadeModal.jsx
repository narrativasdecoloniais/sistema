"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ConteudoRichText from "@/components/ConteudoRichText";
import Modal from "./Modal";
import { listarTrabalhosDaAtividade } from "@/lib/participanteSubmissoes";
import { detalheAtividade, linkAtividade } from "@/lib/apresentacao";
import styles from "./TrabalhosDaAtividadeModal.module.scss";

// Trabalhos da atividade em que a submissão vai ser apresentada, na ordem de
// apresentação — só quando a organização libera os outros trabalhos aos
// autores (apresentacao.outrosTrabalhosVisiveis). Resumo sob demanda.
export default function TrabalhosDaAtividadeModal({ submissaoId, onFechar }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [aberto, setAberto] = useState(null);

  useEffect(() => {
    let cancelado = false;
    listarTrabalhosDaAtividade(submissaoId)
      .then((resposta) => {
        if (!cancelado) setDados(resposta);
      })
      .catch((falha) => {
        if (!cancelado) setErro(falha.message);
      });
    return () => {
      cancelado = true;
    };
  }, [submissaoId]);

  return (
    <Modal titulo="Trabalhos da atividade" onFechar={onFechar} largo>
      {erro ? (
        <p className={styles.mensagem}>{erro}</p>
      ) : !dados ? (
        <p className={styles.mensagem}>Carregando...</p>
      ) : (
        <div className={styles.corpo}>
          <div className={styles.atividade}>
            <Link href={linkAtividade(dados.edicao, dados.atividade)} className={styles.linkAtividade}>
              {dados.atividade.nome}
            </Link>
            <p className={styles.detalhe}>{detalheAtividade(dados.atividade)}</p>
          </div>

          <ol className={styles.lista}>
            {dados.trabalhos.map((trabalho, indice) => {
              const expandido = aberto === trabalho.id;
              const idResumo = `resumo-${trabalho.id}`;
              return (
                <li key={trabalho.id} className={styles.item}>
                  <span className={styles.ordem} aria-hidden="true">
                    {trabalho.ordemApresentacao ?? indice + 1}
                  </span>
                  <div className={styles.itemCorpo}>
                    <p className={styles.itemTitulo}>
                      {trabalho.titulo}
                      {trabalho.proprio && <span className={styles.tag}>Seu trabalho</span>}
                    </p>
                    <p className={styles.itemMeta}>
                      {[trabalho.modalidadeSubmissao?.nome, trabalho.areaSubmissao?.titulo].filter(Boolean).join(" · ")}
                    </p>
                    <p className={styles.itemAutores}>{trabalho.autores.map((autor) => autor.nome).join(", ")}</p>
                    <button
                      type="button"
                      className={styles.botaoTexto}
                      aria-expanded={expandido}
                      aria-controls={idResumo}
                      onClick={() => setAberto(expandido ? null : trabalho.id)}
                    >
                      {expandido ? "Ocultar resumo" : "Ver resumo"}
                    </button>
                    {expandido && (
                      <div id={idResumo} className={styles.resumo}>
                        <span className={styles.rotulo}>Resumo</span>
                        <ConteudoRichText className={styles.conteudo} html={trabalho.resumo} tipo="resumo" />
                        {trabalho.referenciaBibliografica && (
                          <>
                            <span className={styles.rotulo}>Referências</span>
                            <ConteudoRichText
                              className={styles.conteudo}
                              html={trabalho.referenciaBibliografica}
                              tipo="referencia"
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </Modal>
  );
}
