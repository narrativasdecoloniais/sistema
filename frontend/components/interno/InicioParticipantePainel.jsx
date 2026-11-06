"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Handshake,
  QrCode,
  FileText,
  ClipboardCheck,
  Award,
  ArrowRight,
  ChevronRight,
  Presentation,
  User,
  Clock,
  MapPin,
} from "lucide-react";
import { paraNumeroRomano } from "@/lib/romanos";
import { linkAtividade } from "@/lib/apresentacao";
import { formatarFaixaHorario } from "@/lib/publico";
import { buscarResumoParticipante } from "@/lib/participanteResumo";
import BlocoCalendario from "./BlocoCalendario";
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
      acoes: [{ href: `${href}?inscrever=1`, rotulo: "Inscrever-se", principal: true }],
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
      agora: true,
      titulo: "Credenciamento feito",
      detalhes: ["Nas atividades com inscrição, mostre seu crachá à equipe ou leia o QR code da sala para registrar sua presença."],
      acoes: [
        { href: "/participante/credenciamento", rotulo: "Mostrar crachá" },
        { href: "/participante/credenciamento?aba=ler", rotulo: "Ler QR code" },
      ],
    };
  }
  return {
    chave: "credenciamento",
    Icone: QrCode,
    rotulo: "Credenciamento",
    agora: true,
    titulo: "O evento está acontecendo",
    detalhes: ["Mostre seu crachá à equipe na entrada do evento ou leia o QR code afixado lá."],
    pendente: "Você ainda não se credenciou.",
    acoes: [
      { href: "/participante/credenciamento", rotulo: "Mostrar crachá", principal: true },
      { href: "/participante/credenciamento?aba=ler", rotulo: "Ler QR code" },
    ],
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

  if (monitoria.dadosPendentes) {
    return {
      chave: "monitoria",
      Icone: Handshake,
      rotulo: "Monitoria",
      titulo: SITUACAO_MONITORIA[monitoria.status],
      detalhes: ["A Coordenação de Monitoria incluiu você na monitoria desta edição."],
      pendente: "Complete seus dados de monitor(a).",
      acoes: [{ href, rotulo: "Completar dados", principal: true }],
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

// "Hoje" em Brasília (UTC−3, sem horário de verão), no mesmo formato
// "ingênuo" das datas do backend.
function hojeEmBrasilia() {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function diasAte(iso) {
  const alvo = Date.parse(new Date(iso).toISOString().slice(0, 10));
  return Math.round((alvo - Date.parse(hojeEmBrasilia())) / 86400000);
}

// Contagem regressiva — o dia e a hora em si ficam no bloco de calendário,
// então o título não os repete.
function quandoApresenta(iso) {
  const dias = diasAte(iso);
  if (dias <= 0) return "é hoje";
  if (dias === 1) return "é amanhã";
  return `é em ${dias} dias`;
}

// Um trabalho a apresentar: bloco de calendário (data) + título do trabalho em
// destaque + horário e local em linhas com ícone + sessão como link.
function ItemApresentacao({ apresentacao }) {
  const { atividade } = apresentacao;
  return (
    <li className={styles.apresentacao}>
      <BlocoCalendario iso={atividade.inicioAtividade} />
      <div className={styles.apresentacaoCorpo}>
        <p className={styles.apresentacaoTitulo}>{apresentacao.titulo}</p>
        <ul className={styles.metaLista}>
          <li>
            <Clock size={16} strokeWidth={1.5} aria-hidden="true" />
            <span className={styles.somenteLeitor}>Horário: </span>
            {formatarFaixaHorario(atividade.inicioAtividade, atividade.fimAtividade)}
          </li>
          <li>
            <MapPin size={16} strokeWidth={1.5} aria-hidden="true" />
            <span className={styles.somenteLeitor}>Local: </span>
            {atividade.local || "A definir"}
          </li>
        </ul>
        <p className={styles.sessao}>
          <span className={styles.sessaoRotulo}>Sessão</span>
          <Link href={linkAtividade({ slug: apresentacao.edicaoSlug }, atividade)} className={styles.sessaoLink}>
            {atividade.nome}
          </Link>
        </p>
      </div>
    </li>
  );
}

// Onde e quando a pessoa apresenta (autor ou coautor) — só com a
// distribuição publicada e enquanto a atividade não terminou.
// No Início cabem as duas próximas; as demais ficam a um link, em Minhas
// submissões (cada trabalho tem o próprio cartão lá) — o Início não pode
// crescer sem limite no celular.
const MAX_APRESENTACOES_INICIO = 2;

function cardApresentacao({ submissoes }) {
  const apresentacoes = submissoes?.apresentacoes || [];
  if (apresentacoes.length === 0) return null;
  const [proxima] = apresentacoes;
  const visiveis = apresentacoes.slice(0, MAX_APRESENTACOES_INICIO);
  const restantes = apresentacoes.length - visiveis.length;
  const unica = apresentacoes.length === 1;
  const quando = quandoApresenta(proxima.atividade.inicioAtividade);

  return {
    chave: "apresentacao",
    Icone: Presentation,
    rotulo: unica ? "Apresentação de trabalho" : `${apresentacoes.length} apresentações de trabalho`,
    agora: true,
    largo: true,
    titulo: unica ? `Sua apresentação ${quando}` : `A próxima ${quando}`,
    corpo: (
      <>
        <ul className={styles.apresentacoes}>
          {visiveis.map((apresentacao) => (
            <ItemApresentacao key={apresentacao.id} apresentacao={apresentacao} />
          ))}
        </ul>
        {restantes > 0 && (
          <Link href="/participante/submissoes" className={styles.maisApresentacoes}>
            + {restantes === 1 ? "1 outra apresentação" : `${restantes} outras apresentações`}
            <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
          </Link>
        )}
      </>
    ),
    acoes: [{ href: "/participante/submissoes", rotulo: "Ver minhas submissões" }],
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

// "Agora": só o que pede ação ou vale para estes dias — pendências primeiro,
// depois credenciamento durante o evento e apresentação marcada. O resto da
// situação de cada área fica nas linhas de "Tudo".
function montarCardsAgora(resumo) {
  const cards = [
    cardCredenciamento,
    cardApresentacao,
    cardInscricao,
    cardMonitoria,
    cardSubmissoes,
    cardAvaliacoes,
    cardCertificados,
  ]
    .map((montar) => montar(resumo))
    .filter((card) => card && (card.pendente || card.agora));
  return [...cards.filter((card) => card.pendente), ...cards.filter((card) => !card.pendente)];
}

// "Tudo": índice fixo de todas as áreas (no celular substitui o menu), cada
// uma com a situação em uma frase. Sem resumo (carregando ou erro) as linhas
// aparecem do mesmo jeito, só sem a situação. Avaliação e Monitoria seguem a
// mesma regra do menu lateral (NavegacaoParticipante).
function situacaoInscricao({ inscricao }) {
  if (!inscricao) return "Nenhuma edição com inscrições no momento";
  if (inscricao.inscrito) {
    const partes = ["Inscrição confirmada"];
    if (inscricao.confirmadas > 0) partes.push(plural(inscricao.confirmadas, "atividade", "atividades"));
    if (inscricao.listaEspera > 0) partes.push(`${inscricao.listaEspera} na lista de espera`);
    return partes.join(" · ");
  }
  if (inscricao.aberta) return inscricao.fim ? `Inscrições abertas até ${formatarDia(inscricao.fim)}` : "Inscrições abertas";
  return "Inscrições fechadas";
}

function situacaoCredenciamento({ inscricao }) {
  if (inscricao?.credenciadoEm) return "Credenciamento feito";
  if (inscricao?.periodoDoEvento) return "Mostre seu crachá na entrada do evento";
  return "Seu crachá e o leitor de QR code";
}

function situacaoSubmissoes({ submissoes }) {
  if (!submissoes) return null;
  const { total, recebendo, fimRecebimento, correcoes } = submissoes;
  if (total > 0) {
    const enviados = plural(total, "trabalho enviado", "trabalhos enviados");
    return correcoes.length > 0 ? `${enviados} · correção pendente` : enviados;
  }
  if (recebendo) return fimRecebimento ? `Submissões abertas até ${formatarDia(fimRecebimento)}` : "Submissões abertas";
  return "Nenhum trabalho enviado";
}

function situacaoAvaliacoes({ avaliacoes }) {
  if (!avaliacoes) return "Nenhum trabalho atribuído a você";
  if (avaliacoes.pendentes > 0) return plural(avaliacoes.pendentes, "trabalho aguardando", "trabalhos aguardando");
  return "Nenhum trabalho aguardando avaliação";
}

function situacaoMonitoria({ monitoria }) {
  if (monitoria.status && !(monitoria.status === "CANCELADA" && monitoria.aberta)) {
    return SITUACAO_MONITORIA[monitoria.status];
  }
  if (monitoria.aberta) return monitoria.fim ? `Seleção aberta até ${formatarDia(monitoria.fim)}` : "Seleção aberta";
  return "Seleção encerrada";
}

function situacaoCertificados({ certificados }) {
  if (certificados?.total > 0) return plural(certificados.total, "certificado disponível", "certificados disponíveis");
  return "Aparecem aqui depois do evento";
}

function montarAreas(resumo, avaliador) {
  const comResumo = (calcular) => (resumo ? calcular(resumo) : null);
  const edicaoId = resumo?.edicao?.id;
  return [
    {
      chave: "inscricao",
      Icone: CalendarCheck,
      rotulo: "Inscrição",
      href: edicaoId ? `/participante/inscricoes/${edicaoId}` : "/participante/inscricoes",
      situacao: comResumo(situacaoInscricao),
    },
    {
      chave: "credenciamento",
      Icone: QrCode,
      rotulo: "Credenciamento",
      href: "/participante/credenciamento",
      situacao: comResumo(situacaoCredenciamento),
    },
    {
      chave: "submissoes",
      Icone: FileText,
      rotulo: "Submissões",
      href: "/participante/submissoes",
      situacao: comResumo(situacaoSubmissoes),
    },
    (avaliador || resumo?.avaliacoes) && {
      chave: "avaliacoes",
      Icone: ClipboardCheck,
      rotulo: "Trabalhos para avaliar",
      href: "/participante/avaliacoes",
      situacao: comResumo(situacaoAvaliacoes),
    },
    resumo?.monitoria && {
      chave: "monitoria",
      Icone: Handshake,
      rotulo: "Monitoria",
      href: edicaoId ? `/participante/monitoria/${edicaoId}` : "/participante/monitoria",
      situacao: situacaoMonitoria(resumo),
    },
    {
      chave: "certificados",
      Icone: Award,
      rotulo: "Certificados",
      href: "/participante/certificados",
      situacao: comResumo(situacaoCertificados),
    },
    {
      chave: "perfil",
      Icone: User,
      rotulo: "Meu perfil",
      href: "/participante/perfil",
      situacao: "Dados pessoais, e-mail e senha",
    },
  ].filter(Boolean);
}

function ListaAreas({ areas }) {
  return (
    <ul className={styles.areas}>
      {areas.map(({ chave, Icone, rotulo, href, situacao }) => (
        <li key={chave}>
          <Link href={href} className={styles.area}>
            <Icone size={20} strokeWidth={1.5} aria-hidden="true" className={styles.iconeArea} />
            <span className={styles.textoArea}>
              <span className={styles.rotuloArea}>{rotulo}</span>
              {situacao && <span className={styles.situacaoArea}>{situacao}</span>}
            </span>
            <ChevronRight size={18} strokeWidth={1.5} aria-hidden="true" className={styles.setaArea} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Card({ card }) {
  const { Icone, rotulo, titulo, detalhes = [], pendente, lista, corpo, acoes } = card;
  const idTitulo = `inicio-${card.chave}`;
  return (
    <article className={`${styles.card} ${card.largo ? styles.cardLargo : ""}`} aria-labelledby={idTitulo}>
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
            <li key={item.chave ?? item.href}>
              <Link href={item.href} className={styles.linkLista}>
                {item.texto}
              </Link>
              {item.apoio && <span className={styles.detalhe}>{item.apoio}</span>}
            </li>
          ))}
        </ul>
      )}
      {corpo}
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

// Tela inicial da área do participante, em duas camadas: "Agora" (cards com
// a próxima ação, só quando há) e "Tudo" (índice fixo de todas as áreas com a
// situação de cada uma) — backend: participanteResumo.service.js.
export default function InicioParticipantePainel({ nome, avaliador = false }) {
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
  const cards = resumo ? montarCardsAgora(resumo) : [];
  const areas = montarAreas(resumo, avaliador);

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

      <section className={styles.secao} aria-labelledby="inicio-agora">
        <h2 id="inicio-agora" className={styles.tituloSecao}>
          Agora
        </h2>
        {erro ? (
          <p className={styles.detalhe} role="alert">
            Não foi possível carregar sua situação. Recarregue a página ou entre em cada área abaixo.
          </p>
        ) : !resumo ? (
          <p className={styles.detalhe} aria-live="polite">
            Carregando...
          </p>
        ) : cards.length === 0 ? (
          <p className={styles.detalhe}>Nada pendente por aqui.</p>
        ) : (
          <div className={styles.grade}>
            {cards.map((card) => (
              <Card key={card.chave} card={card} />
            ))}
          </div>
        )}
      </section>

      <section className={styles.secao} aria-labelledby="inicio-tudo">
        <h2 id="inicio-tudo" className={styles.tituloSecao}>
          Tudo
        </h2>
        <ListaAreas areas={areas} />
      </section>
    </div>
  );
}
