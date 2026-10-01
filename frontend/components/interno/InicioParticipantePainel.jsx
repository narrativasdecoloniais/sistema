"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Handshake, QrCode, FileText, ClipboardCheck, Award, ArrowRight } from "lucide-react";
import { paraNumeroRomano } from "@/lib/romanos";
import { buscarResumoParticipante } from "@/lib/participanteResumo";
import styles from "./InicioParticipantePainel.module.scss";

// Datas do backend são "ingênuas" (horário de Brasília gravado como UTC) —
// formatadas em UTC para não deslocar o dia.
function formatarDia(iso) {
  const [, mes, dia] = new Date(iso).toISOString().slice(0, 10).split("-");
  return `${dia}/${mes}`;
}

function formatarDiaHora(iso) {
  const data = new Date(iso);
  const hora = data.toISOString().slice(11, 16);
  return `${formatarDia(iso)} às ${hora.replace(":", "h")}`;
}

function plural(n, singular, plural) {
  return `${n} ${n === 1 ? singular : plural}`;
}

const SITUACAO_MONITORIA = {
  EM_ANALISE: "Candidatura em análise",
  SELECIONADO: "Candidatura selecionada",
  LISTA_ESPERA: "Candidatura na lista de espera",
  NAO_SELECIONADO: "Candidatura não selecionada",
  CANCELADA: "Candidatura cancelada",
};

// Cada recurso vira um card { chave, Icone, rotulo, titulo, detalhes, pendente,
// acoes } — ou nada, quando não há o que mostrar (monitoria sem edital,
// credenciamento fora dos dias do evento etc.).
function cardInscricao({ edicao, inscricao }) {
  if (!edicao || !inscricao) return null;
  const href = `/participante/inscricoes/${edicao.id}`;

  if (inscricao.inscrito) {
    const atividades = [];
    if (inscricao.confirmadas > 0) atividades.push(plural(inscricao.confirmadas, "atividade confirmada", "atividades confirmadas"));
    if (inscricao.listaEspera > 0) atividades.push(`${inscricao.listaEspera} na lista de espera`);
    return {
      chave: "inscricao",
      Icone: CalendarCheck,
      rotulo: "Inscrição",
      titulo: "Inscrição confirmada",
      detalhes: [
        atividades.length > 0
          ? atividades.join(" · ")
          : inscricao.aberta
            ? "Nenhuma atividade escolhida ainda."
            : "Nenhuma atividade com inscrição.",
      ],
      acoes: [{ href, rotulo: inscricao.aberta ? "Ver e escolher atividades" : "Ver minha inscrição" }],
    };
  }

  if (inscricao.aberta) {
    return {
      chave: "inscricao",
      Icone: CalendarCheck,
      rotulo: "Inscrição",
      titulo: "Inscrições abertas",
      detalhes: [inscricao.fim ? `Até ${formatarDiaHora(inscricao.fim)}.` : null],
      pendente: "Você ainda não se inscreveu nesta edição.",
      acoes: [{ href, rotulo: "Inscrever-se", principal: true }],
    };
  }

  return {
    chave: "inscricao",
    Icone: CalendarCheck,
    rotulo: "Inscrição",
    titulo: "Inscrições fechadas",
    detalhes: ["Quando as inscrições abrirem, é por aqui que você se inscreve."],
    acoes: [],
  };
}

function cardCredenciamento({ inscricao }) {
  if (!inscricao?.periodoDoEvento) return null;
  if (inscricao.credenciadoEm) {
    return {
      chave: "credenciamento",
      Icone: QrCode,
      rotulo: "Credenciamento",
      titulo: "Credenciamento feito",
      detalhes: ["Nas atividades com inscrição, leia o QR code da sala para registrar sua presença."],
      acoes: [{ href: "/participante/credenciamento", rotulo: "Ler QR code" }],
    };
  }
  return {
    chave: "credenciamento",
    Icone: QrCode,
    rotulo: "Credenciamento",
    titulo: "O evento está acontecendo",
    detalhes: ["Leia o QR code na entrada do evento para se credenciar."],
    pendente: "Você ainda não se credenciou.",
    acoes: [{ href: "/participante/credenciamento", rotulo: "Ler QR code", principal: true }],
  };
}

function cardMonitoria({ edicao, monitoria }) {
  if (!edicao || !monitoria) return null;
  const href = `/participante/monitoria/${edicao.id}`;
  const prazo = monitoria.fim ? `Inscrições até ${formatarDiaHora(monitoria.fim)}.` : null;

  if (!monitoria.status || (monitoria.status === "CANCELADA" && monitoria.aberta)) {
    if (!monitoria.aberta) return null;
    return {
      chave: "monitoria",
      Icone: Handshake,
      rotulo: "Monitoria",
      titulo: monitoria.status === "CANCELADA" ? "Você desistiu da candidatura" : "Seleção de monitores aberta",
      detalhes: [prazo],
      acoes: [{ href, rotulo: monitoria.status === "CANCELADA" ? "Candidatar-se de novo" : "Candidatar-se" }],
    };
  }

  return {
    chave: "monitoria",
    Icone: Handshake,
    rotulo: "Monitoria",
    titulo: SITUACAO_MONITORIA[monitoria.status],
    detalhes: [monitoria.status === "EM_ANALISE" ? "O resultado aparece aqui quando a organização divulgar." : null],
    acoes: [{ href, rotulo: "Ver candidatura" }],
  };
}

function cardSubmissoes({ submissoes }) {
  if (!submissoes) return null;
  const { total, recebendo, fimRecebimento, correcoes } = submissoes;
  const novaSubmissao = recebendo ? { href: "/participante/submissoes/nova", rotulo: "Nova submissão" } : null;

  if (correcoes.length > 0) {
    const unica = correcoes.length === 1 ? correcoes[0] : null;
    return {
      chave: "submissoes",
      Icone: FileText,
      rotulo: "Submissões",
      titulo: plural(total, "trabalho enviado", "trabalhos enviados"),
      pendente:
        correcoes.length === 1
          ? `Correção pendente até ${formatarDia(correcoes[0].prazo)}.`
          : `${correcoes.length} correções pendentes até ${formatarDia(correcoes[0].prazo)}.`,
      lista: correcoes.map((correcao) => ({
        href: `/participante/submissoes/${correcao.id}/correcao`,
        texto: correcao.titulo,
        apoio: correcao.devolvida ? "Devolvida pela organização" : null,
      })),
      acoes: [
        unica
          ? { href: `/participante/submissoes/${unica.id}/correcao`, rotulo: "Fazer correção", principal: true }
          : { href: "/participante/submissoes", rotulo: "Ver minhas submissões", principal: true },
      ],
    };
  }

  if (total > 0) {
    return {
      chave: "submissoes",
      Icone: FileText,
      rotulo: "Submissões",
      titulo: plural(total, "trabalho enviado", "trabalhos enviados"),
      detalhes: [recebendo && fimRecebimento ? `Submissões abertas até ${formatarDia(fimRecebimento)}.` : null],
      acoes: [{ href: "/participante/submissoes", rotulo: "Ver minhas submissões" }, novaSubmissao].filter(Boolean),
    };
  }

  if (!recebendo) return null;
  return {
    chave: "submissoes",
    Icone: FileText,
    rotulo: "Submissões",
    titulo: "Submissões abertas",
    detalhes: [fimRecebimento ? `Até ${formatarDia(fimRecebimento)}.` : null],
    acoes: [{ href: "/participante/submissoes/nova", rotulo: "Enviar trabalho" }],
  };
}

function cardAvaliacoes({ avaliacoes }) {
  if (!avaliacoes) return null;
  if (avaliacoes.pendentes > 0) {
    return {
      chave: "avaliacoes",
      Icone: ClipboardCheck,
      rotulo: "Avaliação",
      titulo: plural(avaliacoes.pendentes, "trabalho para avaliar", "trabalhos para avaliar"),
      detalhes: [`${avaliacoes.total - avaliacoes.pendentes} de ${avaliacoes.total} já concluídos.`],
      pendente: "Há trabalhos aguardando sua avaliação.",
      acoes: [{ href: "/participante/avaliacoes", rotulo: "Avaliar", principal: true }],
    };
  }
  return {
    chave: "avaliacoes",
    Icone: ClipboardCheck,
    rotulo: "Avaliação",
    titulo: "Nenhum trabalho aguardando avaliação",
    detalhes: [plural(avaliacoes.total, "trabalho atribuído a você", "trabalhos atribuídos a você") + "."],
    acoes: [{ href: "/participante/avaliacoes", rotulo: "Ver trabalhos" }],
  };
}

function cardCertificados({ certificados }) {
  if (!certificados?.total) return null;
  return {
    chave: "certificados",
    Icone: Award,
    rotulo: "Certificados",
    titulo: plural(certificados.total, "certificado disponível", "certificados disponíveis"),
    detalhes: ["Baixe o PDF com QR code de validação."],
    acoes: [{ href: "/participante/certificados", rotulo: "Baixar certificados" }],
  };
}

// O que tem pendência vem primeiro; o resto mantém a ordem do menu lateral.
function montarCards(resumo) {
  const cards = [cardCredenciamento, cardInscricao, cardMonitoria, cardSubmissoes, cardAvaliacoes, cardCertificados]
    .map((montar) => montar(resumo))
    .filter(Boolean);
  return [...cards.filter((card) => card.pendente), ...cards.filter((card) => !card.pendente)];
}

function Card({ card }) {
  const { Icone, rotulo, titulo, detalhes = [], pendente, lista, acoes } = card;
  const idTitulo = `inicio-${card.chave}`;
  return (
    <article className={styles.card} aria-labelledby={idTitulo}>
      <p className={styles.rotulo}>
        <Icone size={16} strokeWidth={1.5} aria-hidden="true" />
        {rotulo}
      </p>
      <h2 id={idTitulo} className={styles.titulo}>
        {titulo}
      </h2>
      {pendente && <p className={styles.pendente}>{pendente}</p>}
      {detalhes.filter(Boolean).map((detalhe) => (
        <p key={detalhe} className={styles.detalhe}>
          {detalhe}
        </p>
      ))}
      {lista?.length > 0 && (
        <ul className={styles.lista}>
          {lista.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={styles.linkLista}>
                {item.texto}
              </Link>
              {item.apoio && <span className={styles.detalhe}>{item.apoio}</span>}
            </li>
          ))}
        </ul>
      )}
      {acoes.length > 0 && (
        <div className={styles.acoes}>
          {acoes.map((acao) => (
            <Link
              key={acao.href}
              href={acao.href}
              className={`${styles.acao} ${acao.principal ? styles.acaoPrincipal : ""}`}
            >
              {acao.rotulo}
              <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}

// Tela inicial da área do participante: um card por recurso, com a situação
// da pessoa e a próxima ação (backend: participanteResumo.service.js).
export default function InicioParticipantePainel({ nome }) {
  const [resumo, setResumo] = useState(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let cancelado = false;
    buscarResumoParticipante()
      .then((dados) => {
        if (!cancelado) setResumo(dados);
      })
      .catch(() => {
        if (!cancelado) setErro(true);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const primeiroNome = nome?.trim().split(/\s+/)[0];
  const cards = resumo ? montarCards(resumo) : [];

  return (
    <div className={styles.pagina}>
      <div>
        <h1 className={styles.tituloPagina}>{primeiroNome ? `Olá, ${primeiroNome}` : "Início"}</h1>
        <p className={styles.descricao}>
          {resumo?.edicao
            ? `Sua situação na ${paraNumeroRomano(resumo.edicao.numero)} edição e o que há para fazer agora.`
            : "Sua situação no evento e o que há para fazer agora."}
        </p>
      </div>

      {erro ? (
        <div className={styles.vazio}>
          <p>Não foi possível carregar sua situação.</p>
          <p className={styles.detalhe}>Recarregue a página ou use o menu para acessar cada área.</p>
        </div>
      ) : !resumo ? (
        <div className={styles.vazio} aria-live="polite">
          <p>Carregando...</p>
        </div>
      ) : cards.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nada pendente por aqui.</p>
          <p className={styles.detalhe}>
            Quando abrirem inscrições, submissões ou certificados, eles aparecem nesta tela.
          </p>
        </div>
      ) : (
        <div className={styles.grade}>
          {cards.map((card) => (
            <Card key={card.chave} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
