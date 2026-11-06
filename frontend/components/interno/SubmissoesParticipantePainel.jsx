"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  MapPin,
  Plus,
  Users,
} from "lucide-react";
import Botao from "@/components/forms/Botao";
import { paraNumeroRomano } from "@/lib/romanos";
import {
  baixarCartaAceite,
  listarMinhasSubmissoes,
} from "@/lib/participanteSubmissoes";
import {
  listarModalidadesSubmissaoPublicas,
  prazoSubmissaoAberto,
} from "@/lib/publico";
import {
  formatarPrazoCorrecao,
  rotuloDecisaoParticipante,
} from "@/lib/avaliacoes";
import { linkAtividade } from "@/lib/apresentacao";
import { formatarFaixaHorario, formatarHoraCurta } from "@/lib/publico";
import {
  ROTULOS_SITUACAO_COAUTOR,
  formatarDataHoraCurta,
} from "@/lib/coautores";
import { apiClient } from "@/lib/apiClient";
import { useToast } from "./ToastProvider";
import TrabalhosDaAtividadeModal from "./TrabalhosDaAtividadeModal";
import BlocoCalendario from "./BlocoCalendario";
import styles from "./SubmissoesParticipantePainel.module.scss";

// Datas de prazo são "ingênuas" (Brasília gravado como UTC): dia em UTC.
function formatarDiaMes(iso) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(iso));
}

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function SubmissoesParticipantePainel() {
  const router = useRouter();
  const [submissoes, setSubmissoes] = useState(null);
  const [modalidades, setModalidades] = useState(null);
  // id da submissão cujos trabalhos da atividade estão abertos no modal.
  const [trabalhosAtividadeDe, setTrabalhosAtividadeDe] = useState(null);
  // Accordion (só com mais de uma submissão): ids abertos; null = ainda no
  // padrão (abertas as que têm correção pendente; sem nenhuma, a primeira).
  const [abertos, setAbertos] = useState(null);

  useEffect(() => {
    let cancelado = false;
    listarMinhasSubmissoes()
      .then((dados) => {
        if (!cancelado) setSubmissoes(dados);
      })
      .catch(() => {
        if (!cancelado) setSubmissoes([]);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    let cancelado = false;
    listarModalidadesSubmissaoPublicas()
      .then((dados) => {
        if (!cancelado) setModalidades(dados);
      })
      .catch(() => {
        if (!cancelado) setModalidades([]);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Cada modalidade tem seu próprio prazo: o botão só aparece com pelo menos
  // uma aberta (o formulário — FormularioSubmissaoParticipante — já impede a
  // escolha das encerradas). Fechado, nem botão desabilitado nem aviso: não
  // há nada a fazer, e o estado vazio explica quando não há trabalhos.
  const carregandoModalidades = modalidades === null;
  const modalidadesAbertas = (modalidades || []).filter((modalidade) =>
    prazoSubmissaoAberto(modalidade.prazoInicio, modalidade.prazoFim),
  );
  const recebendo = modalidadesAbertas.length > 0;
  const fimRecebimento = modalidadesAbertas.reduce(
    (maior, modalidade) =>
      !maior || modalidade.prazoFim > maior ? modalidade.prazoFim : maior,
    null,
  );

  const recolhivel = (submissoes?.length || 0) > 1;
  const idsAbertos = abertos ?? abertosPorPadrao(submissoes || []);
  const todosAbertos =
    recolhivel && (submissoes || []).every((item) => idsAbertos.has(item.id));

  function alternarAberto(id) {
    const proximo = new Set(idsAbertos);
    if (proximo.has(id)) proximo.delete(id);
    else proximo.add(id);
    setAbertos(proximo);
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Minhas submissões</h1>
          <p className={styles.descricao}>
            Trabalhos que você enviou, como autor principal ou coautor.
          </p>
        </div>
        {recebendo && (
          <div className={styles.novaSubmissao}>
            <Botao
              type="button"
              onClick={() => router.push("/participante/submissoes/nova")}
            >
              <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
              Nova submissão
            </Botao>
            {fimRecebimento && (
              <p className={styles.prazoAberto}>
                Submissões abertas até {formatarDiaMes(fimRecebimento)}
              </p>
            )}
          </div>
        )}
      </div>

      {submissoes === null ? (
        <div className={styles.vazio}>
          <p>Carregando...</p>
        </div>
      ) : submissoes.length === 0 ? (
        <div className={styles.vazio}>
          <p>Você ainda não enviou nenhum trabalho.</p>
          {!carregandoModalidades && (
            <p className={styles.vazioApoio}>
              {recebendo
                ? "Use o botão acima para fazer sua primeira submissão."
                : "As submissões não estão abertas no momento. Quando abrirem, é por aqui que você envia seu trabalho."}
            </p>
          )}
        </div>
      ) : (
        <div className={styles.lista}>
          {recolhivel && (
            <div className={styles.barraLista}>
              <p className={styles.contagem}>{submissoes.length} trabalhos</p>
              <button
                type="button"
                className={styles.botaoTexto}
                onClick={() =>
                  setAbertos(
                    todosAbertos
                      ? new Set()
                      : new Set(submissoes.map((item) => item.id)),
                  )
                }
              >
                {todosAbertos ? "Recolher todos" : "Abrir todos"}
              </button>
            </div>
          )}
          {submissoes.map((submissao) => (
            <CartaoSubmissao
              key={submissao.id}
              submissao={submissao}
              setSubmissoes={setSubmissoes}
              recolhivel={recolhivel}
              aberto={!recolhivel || idsAbertos.has(submissao.id)}
              onAlternar={() => alternarAberto(submissao.id)}
              onVerTrabalhosAtividade={() =>
                setTrabalhosAtividadeDe(submissao.id)
              }
            />
          ))}
        </div>
      )}

      {trabalhosAtividadeDe && (
        <TrabalhosDaAtividadeModal
          submissaoId={trabalhosAtividadeDe}
          onFechar={() => setTrabalhosAtividadeDe(null)}
        />
      )}
    </div>
  );
}

// Situação do trabalho num selo discreto no topo do cartão: ponto colorido +
// texto, sem caixa colorida (DESIGN.md). Antes da divulgação a API não manda
// a decisão.
function situacaoSubmissao(resultado) {
  if (!resultado) return { rotulo: "Aguardando resultado", tom: "neutro" };
  const rotulo = rotuloDecisaoParticipante(
    resultado.decisao,
    resultado.statusCorrecao,
  );
  if (resultado.decisao === "REPROVADO") return { rotulo, tom: "erro" };
  if (["PENDENTE", "DEVOLVIDA", "ENVIADA"].includes(resultado.statusCorrecao))
    return { rotulo, tom: "alerta" };
  return { rotulo, tom: "sucesso" };
}

function SeloSituacao({ resultado }) {
  const { rotulo, tom } = situacaoSubmissao(resultado);
  return (
    <span className={`${styles.selo} ${styles[`selo_${tom}`]}`}>
      <span className={styles.seloPonto} aria-hidden="true" />
      {rotulo}
    </span>
  );
}

// Um trabalho: cabeçalho (modalidade, título, área e situação), o próximo
// passo da correção quando há, autores e apresentação lado a lado no desktop
// e, no rodapé, a data de envio e as ações (ver trabalho, carta de aceite).
function correcaoPendente(resultado) {
  return Boolean(
    resultado &&
    ["PENDENTE", "DEVOLVIDA"].includes(resultado.statusCorrecao) &&
    resultado.prazoAberto,
  );
}

function abertosPorPadrao(submissoes) {
  const pendentes = submissoes.filter((item) =>
    correcaoPendente(item.resultado),
  );
  return new Set(
    (pendentes.length > 0 ? pendentes : submissoes.slice(0, 1)).map(
      (item) => item.id,
    ),
  );
}

// Uma linha com o que importa quando o cartão está recolhido: correção
// pendente, correção em conferência ou quando a pessoa apresenta.
function resumoRecolhido(submissao) {
  const { resultado, apresentacao } = submissao;
  if (correcaoPendente(resultado)) {
    return {
      texto: `Correção pendente até ${formatarPrazoCorrecao(resultado.prazoCorrecao)}`,
      destaque: true,
    };
  }
  if (resultado?.statusCorrecao === "ENVIADA") {
    return { texto: "Correção em conferência pela organização" };
  }
  if (apresentacao) {
    const inicio = apresentacao.atividade.inicioAtividade;
    const dia = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "UTC",
    }).format(new Date(inicio));
    return { texto: `Apresenta em ${dia}, às ${formatarHoraCurta(inicio)}` };
  }
  return null;
}

// Com mais de uma submissão o cartão vira accordion: recolhido mostra só o
// cabeçalho (modalidade, situação, título) e uma linha de resumo; o cabeçalho
// inteiro alterna (o botão no título é o alvo de teclado/leitor de tela).
function CartaoSubmissao({
  submissao,
  setSubmissoes,
  recolhivel = false,
  aberto = true,
  onAlternar,
  onVerTrabalhosAtividade,
}) {
  const { resultado, apresentacao } = submissao;
  const idTitulo = `submissao-${submissao.id}`;
  const idCorpo = `submissao-corpo-${submissao.id}`;
  const resumo = recolhivel && !aberto ? resumoRecolhido(submissao) : null;

  function aoClicarCabecalho(evento) {
    if (!recolhivel || evento.target.closest("button, a")) return;
    onAlternar();
  }

  const titulo = recolhivel ? (
    <button
      type="button"
      className={styles.alternar}
      aria-expanded={aberto}
      aria-controls={idCorpo}
      onClick={onAlternar}
    >
      <span>{submissao.titulo}</span>
      <ChevronDown
        size={20}
        strokeWidth={1.5}
        aria-hidden="true"
        className={`${styles.alternarSeta} ${aberto ? styles.alternarSetaAberta : ""}`}
      />
    </button>
  ) : (
    submissao.titulo
  );

  return (
    <article
      className={`${styles.cartao} ${recolhivel && !aberto ? styles.cartaoRecolhido : ""}`}
      aria-labelledby={idTitulo}
    >
      <header
        className={`${styles.cartaoCabecalho} ${recolhivel ? styles.cabecalhoClicavel : ""}`}
        onClick={aoClicarCabecalho}
      >
        <div className={styles.cartaoTopo}>
          <p className={styles.eyebrow}>
            {submissao.modalidadeSubmissao.nome} ·{" "}
            {paraNumeroRomano(submissao.edicao.numero)} edição
          </p>
          <SeloSituacao resultado={resultado} />
        </div>
        <h2 id={idTitulo} className={styles.cartaoTitulo}>
          {titulo}
        </h2>
        {submissao.areaSubmissao?.titulo && (
          <p className={styles.cartaoArea}>
            <span className={styles.somenteLeitor}>Área temática: </span>
            {submissao.areaSubmissao.titulo}
          </p>
        )}
        {resumo && (
          <p
            className={
              resumo.destaque ? styles.resumoPendente : styles.resumoRecolhido
            }
          >
            {resumo.texto}
          </p>
        )}
      </header>

      {aberto && (
        <div id={idCorpo} className={styles.cartaoCorpo}>
          {resultado && (
            <ResultadoSubmissao
              id={submissao.id}
              resultado={resultado}
              ehAutorPrincipal={submissao.ehAutorPrincipal}
            />
          )}

          <div
            className={`${styles.detalhes} ${apresentacao ? styles.detalhesDuplos : ""}`}
          >
            <AutoresSubmissao
              submissao={submissao}
              setSubmissoes={setSubmissoes}
            />
            {apresentacao && (
              <ApresentacaoSubmissao
                edicao={submissao.edicao}
                apresentacao={apresentacao}
              />
            )}
          </div>

          {apresentacao?.outrosTrabalhosVisiveis && (
            <button
              type="button"
              className={styles.trabalhosSessao}
              onClick={onVerTrabalhosAtividade}
            >
              <span className={styles.trabalhosSessaoIcone} aria-hidden="true">
                <Users size={20} strokeWidth={1.5} />
              </span>
              <span className={styles.trabalhosSessaoTexto}>
                <span className={styles.trabalhosSessaoTitulo}>
                  Trabalhos desta sessão
                </span>
                <span className={styles.trabalhosSessaoApoio}>
                  Conheça os trabalhos que serão apresentados junto com o seu.
                </span>
              </span>
              <ChevronRight
                size={20}
                strokeWidth={1.5}
                aria-hidden="true"
                className={styles.trabalhosSessaoSeta}
              />
            </button>
          )}

          <footer className={styles.cartaoRodape}>
            <p className={styles.cartaoData}>
              Enviado em {formatarData(submissao.createdAt)}
            </p>
            <div className={styles.cartaoAcoes}>
              {resultado?.cartaAceiteDisponivel && (
                <BotaoCartaAceite id={submissao.id} />
              )}
              {/* Prévia na pele do site público: abre em outra aba para não
              perder a lista. */}
              <a
                href={`/participante/submissoes/${submissao.id}/previa`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.acaoSecundaria}
              >
                Ver trabalho
                <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true" />
                <span className={styles.somenteLeitor}>
                  {" "}
                  (abre em nova aba)
                </span>
              </a>
            </div>
          </footer>
        </div>
      )}
    </article>
  );
}

// Uma linha por autor, na ordem do trabalho. Só o autor principal recebe a
// situação de cadastro dos coautores (a API omite para coautores) e pode
// reenviar o convite — no máximo um a cada 24 h por coautor.
function AutoresSubmissao({ submissao, setSubmissoes }) {
  const { notificar } = useToast();
  const [reenviando, setReenviando] = useState(null);

  async function reenviar(autor) {
    setReenviando(autor.id);
    try {
      const resposta = await apiClient.post(
        `/participante/submissoes/${submissao.id}/autores/${autor.id}/convite`,
      );
      notificar(resposta.mensagem);
      setSubmissoes((atuais) =>
        atuais.map((item) =>
          item.id !== submissao.id
            ? item
            : {
                ...item,
                autores: item.autores.map((outro) =>
                  outro.id === autor.id
                    ? {
                        ...outro,
                        cadastro: { ...outro.cadastro, situacao: "NA_FILA" },
                      }
                    : outro,
                ),
              },
        ),
      );
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setReenviando(null);
    }
  }

  return (
    <section
      className={styles.bloco}
      aria-labelledby={`autores-${submissao.id}`}
    >
      <h3 id={`autores-${submissao.id}`} className={styles.rotuloBloco}>
        {submissao.autores.length === 1 ? "Autoria" : "Autores"}
      </h3>
      <ul className={styles.autores}>
        {submissao.autores.map((autor) => (
          <li key={autor.id ?? autor.nome} className={styles.autor}>
            <span className={styles.autorNome}>
              {autor.nome}
              {autor.principal && (
                <span className={styles.autorPapel}>autor(a) principal</span>
              )}
            </span>
            {autor.cadastro && (
              <span className={styles.autorCadastro}>
                <span
                  className={
                    autor.cadastro.situacao === "CADASTRADO"
                      ? styles.cadastrado
                      : undefined
                  }
                >
                  {ROTULOS_SITUACAO_COAUTOR[autor.cadastro.situacao]}
                  {autor.cadastro.situacao === "CONVITE_ENVIADO" &&
                  autor.cadastro.enviadoEm
                    ? ` em ${formatarDataHoraCurta(autor.cadastro.enviadoEm)}`
                    : ""}
                </span>
                {autor.cadastro.situacao !== "CADASTRADO" &&
                  autor.cadastro.situacao !== "NA_FILA" && (
                    <button
                      type="button"
                      className={styles.botaoTexto}
                      onClick={() => reenviar(autor)}
                      disabled={reenviando === autor.id}
                    >
                      {reenviando === autor.id
                        ? "Enviando..."
                        : autor.cadastro.enviadoEm
                          ? "Reenviar convite"
                          : "Enviar convite"}
                    </button>
                  )}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

// Onde e quando o trabalho é apresentado: folha de calendário + horário e
// local, e a sessão (atividade) como link para a página pública. Os outros
// trabalhos da sessão ficam numa faixa própria do cartão (CartaoSubmissao).
function ApresentacaoSubmissao({ edicao, apresentacao }) {
  const { atividade } = apresentacao;
  return (
    <section
      className={styles.bloco}
      aria-labelledby={`apresentacao-${atividade.slug}`}
    >
      <h3 id={`apresentacao-${atividade.slug}`} className={styles.rotuloBloco}>
        Apresentação
      </h3>
      <div className={styles.apresentacao}>
        <BlocoCalendario iso={atividade.inicioAtividade} />
        <ul className={styles.metaLista}>
          <li>
            <Clock size={16} strokeWidth={1.5} aria-hidden="true" />
            <span className={styles.somenteLeitor}>Horário: </span>
            {formatarFaixaHorario(
              atividade.inicioAtividade,
              atividade.fimAtividade,
            )}
          </li>
          <li>
            <MapPin size={16} strokeWidth={1.5} aria-hidden="true" />
            <span className={styles.somenteLeitor}>Local: </span>
            {atividade.local || "A definir"}
          </li>
        </ul>
      </div>
      <p className={styles.sessao}>
        <span className={styles.sessaoRotulo}>Sessão</span>
        <Link
          href={linkAtividade(edicao, atividade)}
          className={styles.sessaoLink}
        >
          {atividade.nome}
        </Link>
      </p>
    </section>
  );
}

const ACAO_CORRECAO = {
  APROVADO_COM_RESSALVAS: {
    botao: "Corrigir trabalho",
    verbo: "enviar a versão corrigida",
  },
  APROVADO_FORMATACAO: {
    botao: "Revisar",
    verbo: "revisar a formatação do resumo e das referências",
  },
};

// Formatação já revisada continua editável dentro do prazo, até os Anais
// saírem (podeCorrigir vem da API — utils/prazoCorrecao.js).
const ACAO_REVISAR_DE_NOVO = "Editar trabalho";

// Só chega preenchido depois que a organização divulga o resultado (a API
// omite a decisão antes disso). A decisão em si já está no selo do topo;
// aqui fica o que a pessoa precisa saber ou fazer: observação da
// organização, devolução e o prazo/ação da correção. Sem nada disso, some.
function ResultadoSubmissao({ id, resultado, ehAutorPrincipal }) {
  const acao = ACAO_CORRECAO[resultado.decisao];
  const prazo = formatarPrazoCorrecao(resultado.prazoCorrecao);
  const pendente =
    ["PENDENTE", "DEVOLVIDA"].includes(resultado.statusCorrecao) &&
    resultado.prazoAberto;
  const revisarDeNovo =
    resultado.statusCorrecao === "CONCLUIDA" && resultado.podeCorrigir;

  let situacao = null;
  if (acao) {
    // podeCorrigir só vem para o autor principal.
    if (revisarDeNovo)
      situacao = `Você ainda pode ajustar até ${prazo}, enquanto os Anais não forem publicados.`;
    else if (resultado.statusCorrecao === "CONCLUIDA")
      situacao = "Correção concluída.";
    else if (resultado.statusCorrecao === "ENVIADA")
      situacao = "Correção enviada — aguardando conferência da organização.";
    else if (!resultado.prazoAberto)
      situacao = `O prazo de correção terminou em ${prazo}. Fale com a organização.`;
    else if (ehAutorPrincipal)
      situacao = `Você precisa ${acao.verbo} até ${prazo}.`;
    else situacao = `O autor principal precisa ${acao.verbo} até ${prazo}.`;
  }

  const mostrarAcao = resultado.podeCorrigir && acao;
  if (
    !resultado.observacao &&
    !(resultado.statusCorrecao === "DEVOLVIDA" && resultado.motivoDevolucao) &&
    !situacao
  ) {
    return null;
  }

  return (
    <section
      className={`${styles.proximoPasso} ${pendente ? styles.proximoPassoPendente : ""}`}
      aria-label="Resultado"
    >
      <div className={styles.proximoPassoTexto}>
        {resultado.observacao && (
          <p className={styles.texto}>
            <span className={styles.rotuloInline}>
              Observação da organização
            </span>
            {resultado.observacao}
          </p>
        )}
        {resultado.statusCorrecao === "DEVOLVIDA" &&
          resultado.motivoDevolucao && (
            <p className={styles.texto}>
              <span className={styles.rotuloInline}>Correção devolvida</span>
              {resultado.motivoDevolucao}
            </p>
          )}
        {situacao && (
          <p className={pendente ? styles.textoPendente : styles.texto}>
            {situacao}
          </p>
        )}
      </div>
      {mostrarAcao && (
        <Link
          href={`/participante/submissoes/${id}/correcao`}
          className={pendente ? styles.acaoPrincipal : styles.acaoSecundaria}
        >
          {revisarDeNovo ? ACAO_REVISAR_DE_NOVO : acao.botao}
        </Link>
      )}
    </section>
  );
}

// Só para o autor principal de trabalho que atende o critério da carta da
// edição — a API manda cartaAceiteDisponivel.
function BotaoCartaAceite({ id }) {
  const { notificar } = useToast();
  const [baixando, setBaixando] = useState(false);

  async function baixar() {
    setBaixando(true);
    try {
      await baixarCartaAceite(id);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setBaixando(false);
    }
  }

  return (
    <button
      type="button"
      className={styles.acaoSecundaria}
      onClick={baixar}
      disabled={baixando}
    >
      <Download size={16} strokeWidth={1.5} aria-hidden="true" />
      {baixando ? "Baixando..." : "Carta de aceite"}
    </button>
  );
}
