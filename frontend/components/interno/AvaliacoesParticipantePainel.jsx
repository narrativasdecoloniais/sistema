"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CampoSelecao from "./CampoSelecao";
import { paraNumeroRomano } from "@/lib/romanos";
import { listarMinhasAvaliacoes } from "@/lib/participanteAvaliacoes";
import { ROTULOS_DECISAO, STATUS_AVALIADOR, ROTULOS_STATUS_AVALIADOR } from "@/lib/avaliacoes";
import styles from "./AvaliacoesParticipante.module.scss";

// Agrupa por edição, da mais recente para a mais antiga.
function agruparPorEdicao(avaliacoes) {
  const grupos = new Map();
  for (const avaliacao of avaliacoes) {
    const { edicao } = avaliacao.submissao;
    if (!grupos.has(edicao.id)) grupos.set(edicao.id, { edicao, itens: [] });
    grupos.get(edicao.id).itens.push(avaliacao);
  }
  return [...grupos.values()].sort((a, b) => b.edicao.numero - a.edicao.numero);
}

export default function AvaliacoesParticipantePainel() {
  const [avaliacoes, setAvaliacoes] = useState(null);
  const [erro, setErro] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelado = false;
    listarMinhasAvaliacoes()
      .then((dados) => {
        if (!cancelado) setAvaliacoes(dados);
      })
      .catch((falha) => {
        if (!cancelado) {
          setErro(falha.message);
          setAvaliacoes([]);
        }
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const grupos = useMemo(
    () => agruparPorEdicao((avaliacoes || []).filter((avaliacao) => !status || avaliacao.status === status)),
    [avaliacoes, status]
  );
  const pendentes = (avaliacoes || []).filter((avaliacao) => avaliacao.status === "PENDENTE").length;

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Trabalhos para avaliar</h1>
          <p className={styles.descricao}>
            Trabalhos atribuídos a você. A avaliação é cega: os autores não são exibidos.
            {avaliacoes && pendentes > 0 && ` Você tem ${pendentes} ${pendentes === 1 ? "trabalho pendente" : "trabalhos pendentes"}.`}
          </p>
        </div>
        {avaliacoes && avaliacoes.length > 0 && (
          <div className={styles.filtro}>
            <CampoSelecao
              id="filtroStatusAvaliacao"
              rotulo="Mostrar"
              value={status}
              onChange={(evento) => setStatus(evento.target.value)}
            >
              <option value="">Todos</option>
              {STATUS_AVALIADOR.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </option>
              ))}
            </CampoSelecao>
          </div>
        )}
      </div>

      {avaliacoes === null ? (
        <div className={styles.vazio}>
          <p>Carregando...</p>
        </div>
      ) : erro ? (
        <div className={styles.vazio}>
          <p>Não foi possível carregar suas avaliações.</p>
          <p className={styles.vazioApoio}>{erro} Recarregue a página para tentar de novo.</p>
        </div>
      ) : avaliacoes.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhum trabalho atribuído a você ainda.</p>
          <p className={styles.vazioApoio}>
            Quando a organização distribuir os trabalhos, eles aparecem aqui.
          </p>
        </div>
      ) : grupos.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhum trabalho com esse status.</p>
        </div>
      ) : (
        grupos.map(({ edicao, itens }) => (
          <section key={edicao.id} className={styles.grupo} aria-labelledby={`edicao-${edicao.id}`}>
            <h2 id={`edicao-${edicao.id}`} className={styles.tituloGrupo}>
              {paraNumeroRomano(edicao.numero)} edição
            </h2>
            <div className={styles.grade}>
              {itens.map((avaliacao) => (
                <Link key={avaliacao.id} href={`/participante/avaliacoes/${avaliacao.id}`} className={styles.cartao}>
                  <h3 className={styles.cartaoTitulo}>{avaliacao.submissao.titulo}</h3>
                  <p className={styles.cartaoMeta}>
                    {avaliacao.submissao.modalidade.nome}
                    {avaliacao.submissao.area?.titulo ? ` · ${avaliacao.submissao.area.titulo}` : ""}
                  </p>
                  <p className={styles.cartaoStatus}>
                    <span className={avaliacao.status === "PENDENTE" ? styles.statusPendente : styles.statusNeutro}>
                      {ROTULOS_STATUS_AVALIADOR[avaliacao.status]}
                    </span>
                    {avaliacao.decisao && (
                      <span className={styles.statusNeutro}>Sua decisão: {ROTULOS_DECISAO[avaliacao.decisao]}</span>
                    )}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
