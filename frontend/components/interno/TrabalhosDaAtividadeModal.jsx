"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import ConteudoRichText from "@/components/ConteudoRichText";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import BlocoCalendario from "./BlocoCalendario";
import { listarTrabalhosDaAtividade } from "@/lib/participanteSubmissoes";
import { linkAtividade } from "@/lib/apresentacao";
import { formatarFaixaHorario } from "@/lib/publico";
import styles from "./TrabalhosDaAtividadeModal.module.scss";

function plural(n, singular, plural) {
  return `${n} ${n === 1 ? singular : plural}`;
}

function nomesAutores(trabalho) {
  return trabalho.autores.map((autor) => autor.nome).join(", ");
}

// Trabalhos da sessão (atividade) em que a submissão vai ser apresentada, na
// ordem de apresentação — só quando a organização libera os outros trabalhos
// aos autores (apresentacao.outrosTrabalhosVisiveis). Duas telas no mesmo
// modal: a lista enxuta (título + autores, em linha do tempo, já rolada até o
// trabalho da pessoa) e o detalhe de um trabalho (resumo e referências), com
// anterior/próximo para percorrer a sessão sem voltar à lista.
export default function TrabalhosDaAtividadeModal({ submissaoId, onFechar }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  // Índice do trabalho aberto no detalhe; null = lista.
  const [aberto, setAberto] = useState(null);
  // Último trabalho visto, para a lista voltar até ele.
  const [ultimoVisto, setUltimoVisto] = useState(null);
  const itensRef = useRef([]);
  const tituloDetalheRef = useRef(null);

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

  const trabalhos = dados?.trabalhos || [];
  const indiceProprio = trabalhos.findIndex((trabalho) => trabalho.proprio);
  // Sem a ordem divulgada pela edição (Edicao.apresentacaoComOrdem), a API
  // manda ordemApresentacao nula e a lista vem por título: nada de numeração
  // nem linha do tempo, que sugeririam uma sequência.
  const comOrdem = trabalhos.some((trabalho) => trabalho.ordemApresentacao != null);

  // Lista: abre centrada no trabalho da pessoa; ao voltar do detalhe, no
  // último trabalho visto (com o foco nele, para quem navega pelo teclado).
  useEffect(() => {
    if (!dados || aberto !== null) return;
    const alvo = ultimoVisto ?? (indiceProprio >= 0 ? indiceProprio : null);
    if (alvo === null) return;
    const item = itensRef.current[alvo];
    item?.scrollIntoView({ block: "center" });
    if (ultimoVisto !== null) item?.focus({ preventScroll: true });
  }, [dados, aberto, ultimoVisto, indiceProprio]);

  // Detalhe: foco no título a cada trabalho aberto (anuncia e volta ao topo).
  useEffect(() => {
    if (aberto !== null) tituloDetalheRef.current?.focus();
  }, [aberto]);

  function abrir(indice) {
    setUltimoVisto(indice);
    setAberto(indice);
  }

  function ordemDe(trabalho, indice) {
    return trabalho.ordemApresentacao ?? indice + 1;
  }

  const trabalhoAberto = aberto !== null ? trabalhos[aberto] : null;

  const rodape =
    trabalhoAberto === null ? (
      <Botao type="button" variante="secundario" onClick={onFechar}>
        Fechar
      </Botao>
    ) : (
      <div className={styles.navegacao}>
        <Botao type="button" variante="secundario" disabled={aberto === 0} onClick={() => abrir(aberto - 1)}>
          <ChevronLeft size={18} strokeWidth={1.5} aria-hidden="true" />
          Anterior
        </Botao>
        <Botao
          type="button"
          variante="secundario"
          disabled={aberto === trabalhos.length - 1}
          onClick={() => abrir(aberto + 1)}
        >
          Próximo
          <ChevronRight size={18} strokeWidth={1.5} aria-hidden="true" />
        </Botao>
      </div>
    );

  return (
    <Modal titulo="Trabalhos desta sessão" onFechar={onFechar} largo telaCheiaNoCelular rodape={rodape}>
      {erro ? (
        <p className={styles.mensagem}>{erro}</p>
      ) : !dados ? (
        <p className={styles.mensagem}>Carregando...</p>
      ) : trabalhoAberto ? (
        <article className={styles.detalhe} aria-labelledby="trabalho-sessao-titulo">
          <button type="button" className={styles.voltar} onClick={() => setAberto(null)}>
            <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
            Todos os trabalhos
          </button>

          <div className={styles.detalheCabecalho}>
            <p className={styles.eyebrow}>
              {comOrdem && <>{ordemDe(trabalhoAberto, aberto)}º a apresentar · </>}
              {aberto + 1} de {trabalhos.length}
              {trabalhoAberto.proprio && <span className={styles.tag}>Seu trabalho</span>}
            </p>
            <h3 id="trabalho-sessao-titulo" ref={tituloDetalheRef} tabIndex={-1} className={styles.detalheTitulo}>
              {trabalhoAberto.titulo}
            </h3>
            <p className={styles.detalheAutores}>{nomesAutores(trabalhoAberto)}</p>
          </div>

          <section className={styles.secaoTexto} aria-labelledby="trabalho-sessao-resumo">
            <h4 id="trabalho-sessao-resumo" className={styles.rotulo}>
              Resumo
            </h4>
            <ConteudoRichText className={styles.conteudo} html={trabalhoAberto.resumo} tipo="resumo" />
          </section>

          {trabalhoAberto.referenciaBibliografica && (
            <section className={styles.secaoTexto} aria-labelledby="trabalho-sessao-referencias">
              <h4 id="trabalho-sessao-referencias" className={styles.rotulo}>
                Referências
              </h4>
              <ConteudoRichText
                className={`${styles.conteudo} ${styles.referencias}`}
                html={trabalhoAberto.referenciaBibliografica}
                tipo="referencia"
              />
            </section>
          )}
        </article>
      ) : (
        <div className={styles.corpo}>
          <div className={styles.sessao}>
            <BlocoCalendario iso={dados.atividade.inicioAtividade} />
            <div className={styles.sessaoTexto}>
              <p className={styles.sessaoNome}>{dados.atividade.nome}</p>
              <p className={styles.sessaoMeta}>
                <span>
                  <Clock size={16} strokeWidth={1.5} aria-hidden="true" />
                  <span className={styles.somenteLeitor}>Horário: </span>
                  {formatarFaixaHorario(dados.atividade.inicioAtividade, dados.atividade.fimAtividade)}
                </span>
                <span>
                  <MapPin size={16} strokeWidth={1.5} aria-hidden="true" />
                  <span className={styles.somenteLeitor}>Local: </span>
                  {dados.atividade.local || "A definir"}
                </span>
              </p>
              <Link href={linkAtividade(dados.edicao, dados.atividade)} className={styles.sessaoLink}>
                Página da sessão
                <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <p className={styles.resumoLista}>
            {comOrdem ? (
              <>
                {plural(trabalhos.length, "trabalho", "trabalhos")}, na ordem de apresentação
                {indiceProprio >= 0 && <> · o seu é o {ordemDe(trabalhos[indiceProprio], indiceProprio)}º</>}
              </>
            ) : (
              <>{plural(trabalhos.length, "trabalho", "trabalhos")} nesta sessão</>
            )}
          </p>

          <ol className={`${styles.lista} ${comOrdem ? "" : styles.listaSemOrdem}`}>
            {trabalhos.map((trabalho, indice) => (
              <li key={trabalho.id} className={`${styles.item} ${trabalho.proprio ? styles.itemProprio : ""}`}>
                {comOrdem && (
                  <span className={styles.marcador} aria-hidden="true">
                    {ordemDe(trabalho, indice)}
                  </span>
                )}
                <button
                  type="button"
                  ref={(no) => (itensRef.current[indice] = no)}
                  className={styles.itemBotao}
                  onClick={() => abrir(indice)}
                >
                  {comOrdem && <span className={styles.somenteLeitor}>{ordemDe(trabalho, indice)}º: </span>}
                  <span className={styles.itemTitulo}>{trabalho.titulo}</span>
                  <span className={styles.itemAutores}>
                    {nomesAutores(trabalho)}
                    {trabalho.proprio && <span className={styles.tag}>Seu trabalho</span>}
                  </span>
                  <ChevronRight size={18} strokeWidth={1.5} aria-hidden="true" className={styles.itemSeta} />
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Modal>
  );
}
