"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronRight, CircleCheck, Clock, ListChecks } from "lucide-react";
import { paraNumeroRomano } from "@/lib/romanos";
import { formatarPeriodoEdicao } from "@/lib/publico";
import { listarEdicoesInscricoes } from "@/lib/participanteInscricoes";
import styles from "./InscricoesParticipantePainel.module.scss";

function plural(n, singular, plural) {
  return `${n} ${n === 1 ? singular : plural}`;
}

// Datas do backend são "ingênuas" (horário de Brasília gravado como UTC) —
// formatadas em UTC para não deslocar o dia.
function formatarDiaHora(iso) {
  const data = new Date(iso);
  const dia = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" }).format(data);
  return `${dia}, às ${data.toISOString().slice(11, 16).replace(":", "h")}`;
}

function formatarDiaCurto(iso) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(iso));
}

function resumoAtividades(inscricao) {
  if (!inscricao) return null;
  const partes = [
    inscricao.confirmadas > 0 && plural(inscricao.confirmadas, "atividade confirmada", "atividades confirmadas"),
    inscricao.listaEspera > 0 && `${inscricao.listaEspera} na lista de espera`,
  ].filter(Boolean);
  return partes.length > 0 ? partes.join(" · ") : "Nenhuma atividade escolhida";
}

// Situação num selo discreto: ponto colorido + texto, sem fundo colorido
// (DESIGN.md) — mesmo desenho do selo de Minhas submissões.
function situacao({ aberta, jaInscrito }) {
  if (jaInscrito) return { rotulo: "Inscrito(a)", tom: "sucesso" };
  if (aberta) return { rotulo: "Inscrições abertas", tom: "alerta" };
  return { rotulo: "Encerrada", tom: "neutro" };
}

function Selo({ item }) {
  const { rotulo, tom } = situacao(item);
  return (
    <span className={`${styles.selo} ${styles[`selo_${tom}`]}`}>
      <span className={styles.seloPonto} aria-hidden="true" />
      {rotulo}
    </span>
  );
}

function hrefDe({ edicao, aberta, jaInscrito }) {
  return `/participante/inscricoes/${edicao.id}${!jaInscrito && aberta ? "?inscrever=1" : ""}`;
}

// Edição em destaque (a mais recente da lista): período do evento, prazo das
// inscrições, a situação da pessoa e uma única ação principal.
function EdicaoDestaque({ item }) {
  const { edicao, aberta, jaInscrito, inscricao } = item;
  const idTitulo = `edicao-${edicao.id}`;

  return (
    <article className={styles.destaque} aria-labelledby={idTitulo}>
      <div className={styles.destaqueTopo}>
        <p className={styles.eyebrow}>{paraNumeroRomano(edicao.numero)} edição</p>
        <Selo item={item} />
      </div>

      <h2 id={idTitulo} className={styles.destaqueTitulo}>
        {edicao.nome}
      </h2>

      <ul className={styles.metaLista}>
        <li>
          <CalendarDays size={18} strokeWidth={1.5} aria-hidden="true" />
          <span>
            <span className={styles.metaRotulo}>Evento</span>
            {formatarPeriodoEdicao(edicao.dataInicio, edicao.dataFim)}
          </span>
        </li>
        <li>
          <Clock size={18} strokeWidth={1.5} aria-hidden="true" />
          <span>
            <span className={styles.metaRotulo}>Inscrições</span>
            {aberta
              ? edicao.fimInscricoes
                ? `Abertas até ${formatarDiaHora(edicao.fimInscricoes)}`
                : "Abertas"
              : "Encerradas"}
          </span>
        </li>
        {jaInscrito && (
          <li>
            <ListChecks size={18} strokeWidth={1.5} aria-hidden="true" />
            <span>
              <span className={styles.metaRotulo}>Atividades</span>
              {resumoAtividades(inscricao)}
            </span>
          </li>
        )}
        {inscricao?.credenciadoEm && (
          <li>
            <CircleCheck size={18} strokeWidth={1.5} aria-hidden="true" className={styles.iconeOk} />
            <span>
              <span className={styles.metaRotulo}>Credenciamento</span>
              Feito em {formatarDiaCurto(inscricao.credenciadoEm)}
            </span>
          </li>
        )}
      </ul>

      {(jaInscrito || aberta) && (
        <div className={styles.destaqueRodape}>
          {jaInscrito && inscricao?.inscritoEm && (
            <p className={styles.apoio}>Inscrito(a) em {formatarDiaCurto(inscricao.inscritoEm)}</p>
          )}
          {!jaInscrito && <p className={styles.apoio}>Leva poucos passos e você recebe o comprovante por e-mail.</p>}
          <Link href={hrefDe(item)} className={jaInscrito ? styles.acaoSecundaria : styles.acaoPrincipal}>
            {jaInscrito ? "Ver minha inscrição" : "Inscrever-se"}
            <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </div>
      )}
    </article>
  );
}

// Página "Inscrição": a edição mais recente em destaque e, abaixo, as demais
// (anteriores em que a pessoa se inscreveu) numa lista compacta.
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

  const [principal, ...outras] = inscricoes || [];

  return (
    <div className={styles.pagina}>
      <div>
        <h1 className={styles.titulo}>Inscrição</h1>
        <p className={styles.descricao}>Sua inscrição no evento e nas atividades, edição por edição.</p>
      </div>

      {inscricoes === null ? (
        <p className={styles.apoio} aria-live="polite">
          Carregando...
        </p>
      ) : inscricoes.length === 0 ? (
        <div className={styles.vazio}>
          <CalendarDays size={28} strokeWidth={1.5} aria-hidden="true" />
          <p className={styles.vazioTitulo}>Nenhuma inscrição aberta no momento</p>
          <p className={styles.apoio}>Quando as inscrições da próxima edição abrirem, é por aqui que você se inscreve.</p>
        </div>
      ) : (
        <>
          <EdicaoDestaque item={principal} />

          {outras.length > 0 && (
            <section className={styles.secao} aria-labelledby="outras-edicoes">
              <h2 id="outras-edicoes" className={styles.tituloSecao}>
                Outras edições
              </h2>
              <ul className={styles.lista}>
                {outras.map((item) => (
                  <li key={item.edicao.id}>
                    <Link href={hrefDe(item)} className={styles.linha}>
                      <span className={styles.linhaTexto}>
                        <span className={styles.linhaTitulo}>
                          {paraNumeroRomano(item.edicao.numero)} edição — {item.edicao.nome}
                        </span>
                        <span className={styles.linhaApoio}>
                          {[formatarPeriodoEdicao(item.edicao.dataInicio, item.edicao.dataFim), resumoAtividades(item.inscricao)]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      <Selo item={item} />
                      <ChevronRight size={18} strokeWidth={1.5} aria-hidden="true" className={styles.linhaSeta} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
