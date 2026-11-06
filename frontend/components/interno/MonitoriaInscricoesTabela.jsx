"use client";

import { useMemo, useState } from "react";
import { Eye, UserCheck, ListOrdered, UserX, Mail, UserPlus } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import IncluirMonitorForm from "./IncluirMonitorForm";
import DetalheInscricaoMonitoriaModal from "./DetalheInscricaoMonitoriaModal";
import EnviarEmailModal from "./EnviarEmailModal";
import CabecalhoTabela, { CelulaSelecao, LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela, { BotaoAcaoTabela } from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import useSelecaoLinhas from "./useSelecaoLinhas";
import { useToast } from "./ToastProvider";
import { formatarIdentificacao } from "@/lib/identificacao";
import {
  ROTULOS_STATUS_MONITORIA,
  dataReferenciaIdade,
  definirStatusMonitoriaEmLote,
  idadeEm,
} from "@/lib/monitoria";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";

const SIM_NAO = [
  { valor: "SIM", rotulo: "Sim" },
  { valor: "NAO", rotulo: "Não" },
];

// null = não respondido (inscrição incluída pela organização e ainda não
// completada pela pessoa).
const simNao = (valor) => (valor === null || valor === undefined ? null : valor ? "SIM" : "NAO");
const simNaoTexto = (valor) => (valor === null || valor === undefined ? "" : valor ? "Sim" : "Não");

const ORIGENS = {
  CANDIDATURA: "Candidatura",
  ORGANIZACAO_PENDENTE: "Incluída pela organização (dados pendentes)",
  ORGANIZACAO: "Incluída pela organização",
};

function origem(inscricao) {
  if (!inscricao.incluidaPorId) return "CANDIDATURA";
  return inscricao.cienteEm ? "ORGANIZACAO" : "ORGANIZACAO_PENDENTE";
}

// "menor": sem data de nascimento não dá pra saber.
function situacaoAutorizacao(idade, inscricao) {
  if (idade === null) return "SEM_DATA";
  if (idade >= 18) return "NAO_SE_APLICA";
  return inscricao.temAutorizacao ? "ANEXADA" : "FALTANDO";
}

const ROTULOS_AUTORIZACAO = {
  ANEXADA: "Anexada",
  FALTANDO: "Faltando",
  NAO_SE_APLICA: "Não se aplica",
  SEM_DATA: "Sem data de nascimento",
};

function formatarData(valor) {
  return new Date(valor).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

const ACOES_LOTE = {
  SELECIONADO: { rotulo: "Selecionar", Icone: UserCheck },
  LISTA_ESPERA: { rotulo: "Lista de espera", Icone: ListOrdered },
  NAO_SELECIONADO: { rotulo: "Não selecionar", Icone: UserX },
};

function montarColunas(edicao, inscricoes) {
  const referencia = dataReferenciaIdade(edicao);
  const idade = (inscricao) => (inscricao.dataNascimento ? idadeEm(inscricao.dataNascimento, referencia) : null);
  // Catálogo atual + funções que ficaram em inscrições antigas (o catálogo
  // pode ter sido editado depois).
  const funcoes = [...new Set([...edicao.funcoesMonitoria, ...inscricoes.flatMap((inscricao) => inscricao.funcoes)])];

  return [
    { chave: "nome", rotulo: "Nome", valor: (inscricao) => inscricao.usuario.nome },
    { chave: "email", rotulo: "E-mail", valor: (inscricao) => inscricao.usuario.email },
    {
      chave: "cpf",
      rotulo: "CPF / Documento",
      valor: (inscricao) => inscricao.usuario.cpf || inscricao.usuario.documentoEstrangeiro || null,
      texto: (inscricao) =>
        formatarIdentificacao(inscricao.usuario)
          ? `${formatarIdentificacao(inscricao.usuario)} ${inscricao.usuario.cpf || ""}`
          : "",
      exportar: (inscricao) => formatarIdentificacao(inscricao.usuario) || "",
    },
    {
      chave: "idade",
      rotulo: "Idade no evento",
      valor: idade,
      texto: (inscricao) =>
        idade(inscricao) === null ? "" : `${idade(inscricao)}${idade(inscricao) < 18 ? " (menor)" : ""}`,
    },
    {
      chave: "menor",
      rotulo: "Autorização (menor)",
      valor: (inscricao) => situacaoAutorizacao(idade(inscricao), inscricao),
      filtro: "select",
      opcoes: Object.entries(ROTULOS_AUTORIZACAO).map(([valor, rotulo]) => ({ valor, rotulo })),
      exportar: (inscricao) => ROTULOS_AUTORIZACAO[situacaoAutorizacao(idade(inscricao), inscricao)],
    },
    { chave: "telefone", rotulo: "Telefone", valor: (inscricao) => inscricao.telefone },
    { chave: "pronome", rotulo: "Pronome", valor: (inscricao) => inscricao.pronome || null },
    { chave: "curso", rotulo: "Curso e instituição", valor: (inscricao) => inscricao.cursoInstituicao },
    {
      chave: "experiencia",
      rotulo: "Experiência anterior",
      valor: (inscricao) => simNao(inscricao.experienciaAnterior),
      filtro: "select",
      opcoes: SIM_NAO,
      exportar: (inscricao) => simNaoTexto(inscricao.experienciaAnterior),
    },
    {
      chave: "funcoes",
      rotulo: "Atividades de interesse",
      valor: (inscricao) => inscricao.funcoes.join("; "),
      filtro: "select",
      opcoes: funcoes.map((funcao) => ({ valor: funcao, rotulo: funcao })),
      corresponde: (inscricao, funcao) => inscricao.funcoes.includes(funcao),
    },
    {
      chave: "adaptacao",
      rotulo: "Precisa de adaptação",
      valor: (inscricao) => simNao(inscricao.precisaAdaptacao),
      filtro: "select",
      opcoes: SIM_NAO,
      exportar: (inscricao) => simNaoTexto(inscricao.precisaAdaptacao),
    },
    {
      chave: "adaptacoes",
      rotulo: "Adaptações ou recursos",
      valor: (inscricao) => inscricao.adaptacoesNecessarias || null,
    },
    {
      chave: "status",
      rotulo: "Situação",
      valor: (inscricao) => inscricao.status,
      filtro: "select",
      opcoes: Object.entries(ROTULOS_STATUS_MONITORIA).map(([valor, rotulo]) => ({ valor, rotulo })),
      exportar: (inscricao) => ROTULOS_STATUS_MONITORIA[inscricao.status],
    },
    {
      chave: "posicao",
      rotulo: "Posição na lista de espera",
      valor: (inscricao) => (inscricao.status === "LISTA_ESPERA" ? inscricao.posicaoListaEspera : null),
    },
    {
      chave: "origem",
      rotulo: "Origem",
      valor: origem,
      filtro: "select",
      opcoes: Object.entries(ORIGENS).map(([valor, rotulo]) => ({ valor, rotulo })),
      exportar: (inscricao) => ORIGENS[origem(inscricao)],
    },
    {
      chave: "inscritoEm",
      rotulo: "Inscrito em",
      valor: (inscricao) => new Date(inscricao.createdAt).getTime(),
      texto: (inscricao) => formatarData(inscricao.createdAt),
    },
  ];
}

// podeEnviarEmail: o envio em massa (/emails) é ADMIN-only, então o botão
// só aparece para admin, mesmo com a seção liberada para organizador.
export default function MonitoriaInscricoesTabela({
  edicaoId,
  edicaoNome,
  edicao,
  inscricoes,
  recarregar,
  podeEnviarEmail = false,
}) {
  const { notificar } = useToast();
  const colunas = useMemo(() => montarColunas(edicao, inscricoes), [edicao, inscricoes]);
  const tabela = useTabela(inscricoes, colunas);
  const selecao = useSelecaoLinhas(tabela);
  const [detalheId, setDetalheId] = useState(null);
  const [loteStatus, setLoteStatus] = useState(null);
  const [processandoLote, setProcessandoLote] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [incluindo, setIncluindo] = useState(false);

  // Uma inscrição por pessoa por edição, então cada linha já é uma conta.
  const destinatariosEmail = useMemo(
    () =>
      inscricoes
        .filter((inscricao) => selecao.selecionados.has(inscricao.id))
        .map(({ usuario }) => ({ id: usuario.id, nome: usuario.nome, email: usuario.email })),
    [inscricoes, selecao.selecionados]
  );

  const referencia = dataReferenciaIdade(edicao);
  const divulgado = Boolean(edicao.resultadoMonitoriaDivulgadoEm);
  // Sempre a versão mais recente (a lista recarrega depois de cada mudança).
  const inscricaoEmDetalhe = inscricoes.find((inscricao) => inscricao.id === detalheId);

  async function aplicarLote() {
    setProcessandoLote(true);
    try {
      // Na ordem da tabela — é a ordem das posições na lista de espera.
      const ids = tabela.linhasVisiveis.filter((linha) => selecao.estaSelecionado(linha.id)).map((linha) => linha.id);
      const resposta = await definirStatusMonitoriaEmLote(edicaoId, ids, loteStatus);
      notificar(resposta.mensagem);
      selecao.limpar();
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessandoLote(false);
      setLoteStatus(null);
    }
  }

  async function aoIncluir() {
    setIncluindo(false);
    await recarregar();
  }

  const barraIncluir = (
    <div className={styles.filtros}>
      <Botao type="button" variante="secundario" onClick={() => setIncluindo(true)}>
        <UserPlus size={18} strokeWidth={1.5} aria-hidden="true" />
        Incluir monitor(a)
      </Botao>
    </div>
  );

  const modalIncluir = incluindo && (
    <Modal titulo="Incluir monitor(a)" onFechar={() => setIncluindo(false)}>
      <IncluirMonitorForm
        edicaoId={edicaoId}
        edicao={edicao}
        aoSalvar={aoIncluir}
        aoCancelar={() => setIncluindo(false)}
      />
    </Modal>
  );

  if (inscricoes.length === 0) {
    return (
      <>
        {barraIncluir}
        <div className={styles.vazio}>
          <p>Nenhuma inscrição de monitoria ainda.</p>
          <p className={styles.vazioApoio}>
            As inscrições aparecem aqui conforme as pessoas se inscrevem pela área do participante, dentro do período
            definido em Configurações. Para incluir alguém que não se inscreveu, use &quot;Incluir monitor(a)&quot;.
          </p>
        </div>
        {modalIncluir}
      </>
    );
  }

  return (
    <>
      {barraIncluir}
      <div className={styles.tabelaWrapper}>
        <BotaoExportarTabela tabela={tabela} nomeArquivo="monitoria" nomeAba="Monitoria">
          {podeEnviarEmail && selecao.quantidade > 0 && (
            <BotaoAcaoTabela onClick={() => setEnviandoEmail(true)}>
              <Mail size={16} strokeWidth={1.5} aria-hidden="true" />
              Enviar e-mail ({selecao.quantidade})
            </BotaoAcaoTabela>
          )}
          {selecao.quantidade > 0 &&
            Object.entries(ACOES_LOTE).map(([status, { rotulo, Icone }]) => (
              <BotaoAcaoTabela key={status} onClick={() => setLoteStatus(status)}>
                <Icone size={16} strokeWidth={1.5} aria-hidden="true" />
                {rotulo} ({selecao.quantidade})
              </BotaoAcaoTabela>
            ))}
        </BotaoExportarTabela>
        <table className={styles.tabela}>
          <CabecalhoTabela
            tabela={tabela}
            idTabela="monitoria"
            classeAcoes={styles.colunaAcoes}
            selecao={selecao}
          />
          <tbody>
            {tabela.linhasVisiveis.length === 0 && (
              <LinhaSemResultado tabela={tabela} colSpan={colunas.length + 2} />
            )}
            {tabela.linhasVisiveis.map((inscricao) => {
              const idade = inscricao.dataNascimento ? idadeEm(inscricao.dataNascimento, referencia) : null;
              const autorizacao = situacaoAutorizacao(idade, inscricao);
              const traco = <span className={styles.textoSuave}>—</span>;
              return (
                <tr key={inscricao.id}>
                  <CelulaSelecao selecao={selecao} id={inscricao.id} rotulo={`Selecionar ${inscricao.usuario.nome}`} />
                  <td data-rotulo="Nome">{inscricao.usuario.nome}</td>
                  <td data-rotulo="E-mail">{inscricao.usuario.email}</td>
                  <td data-rotulo="CPF / Documento">{formatarIdentificacao(inscricao.usuario) || "—"}</td>
                  <td data-rotulo="Idade no evento">
                    {idade === null ? (
                      traco
                    ) : (
                      <>
                        {idade}
                        {idade < 18 && <span className={styles.textoSuave}> (menor)</span>}
                      </>
                    )}
                  </td>
                  <td data-rotulo="Autorização (menor)">
                    {autorizacao === "FALTANDO" ? (
                      <strong>Faltando</strong>
                    ) : autorizacao === "ANEXADA" ? (
                      "Anexada"
                    ) : (
                      <span className={styles.textoSuave}>{ROTULOS_AUTORIZACAO[autorizacao]}</span>
                    )}
                  </td>
                  <td data-rotulo="Telefone">{inscricao.telefone || traco}</td>
                  <td data-rotulo="Pronome">{inscricao.pronome || "—"}</td>
                  <td data-rotulo="Curso e instituição">{inscricao.cursoInstituicao || traco}</td>
                  <td data-rotulo="Experiência anterior">{simNaoTexto(inscricao.experienciaAnterior) || traco}</td>
                  <td data-rotulo="Atividades de interesse">{inscricao.funcoes.join("; ") || traco}</td>
                  <td data-rotulo="Precisa de adaptação">{simNaoTexto(inscricao.precisaAdaptacao) || traco}</td>
                  <td data-rotulo="Adaptações ou recursos">{inscricao.adaptacoesNecessarias || "—"}</td>
                  <td data-rotulo="Situação">
                    <span className={styles.tag}>{ROTULOS_STATUS_MONITORIA[inscricao.status]}</span>
                    {divulgado && inscricao.emailResultadoErro && (
                      <span className={styles.textoSuave}> · e-mail com erro</span>
                    )}
                  </td>
                  <td data-rotulo="Posição na lista de espera">
                    {inscricao.status === "LISTA_ESPERA" ? inscricao.posicaoListaEspera : "—"}
                  </td>
                  <td data-rotulo="Origem">
                    {origem(inscricao) === "CANDIDATURA" ? (
                      <span className={styles.textoSuave}>{ORIGENS.CANDIDATURA}</span>
                    ) : (
                      ORIGENS[origem(inscricao)]
                    )}
                  </td>
                  <td data-rotulo="Inscrito em">{formatarData(inscricao.createdAt)}</td>
                  <td data-rotulo="Ações" className={styles.colunaAcoes}>
                    <div className={styles.acoesLinha}>
                      <button
                        type="button"
                        className={styles.botaoIcone}
                        aria-label={`Ver inscrição de ${inscricao.usuario.nome}`}
                        title="Ver inscrição e definir a situação"
                        onClick={() => setDetalheId(inscricao.id)}
                      >
                        <Eye size={16} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalIncluir}

      {enviandoEmail && (
        <EnviarEmailModal
          edicaoId={edicaoId}
          edicaoNome={edicaoNome}
          destinatarios={destinatariosEmail}
          onFechar={() => setEnviandoEmail(false)}
          onEnviado={selecao.limpar}
        />
      )}

      {inscricaoEmDetalhe && (
        <DetalheInscricaoMonitoriaModal
          edicaoId={edicaoId}
          edicao={edicao}
          inscricao={inscricaoEmDetalhe}
          onFechar={() => setDetalheId(null)}
          onAlterada={recarregar}
        />
      )}

      {loteStatus && (
        <ModalConfirmacao
          titulo={`${ACOES_LOTE[loteStatus].rotulo} em lote`}
          mensagem={`${selecao.quantidade} ${selecao.quantidade === 1 ? "inscrição passa" : "inscrições passam"} para "${ROTULOS_STATUS_MONITORIA[loteStatus]}".${
            loteStatus === "LISTA_ESPERA"
              ? " Quem ainda não está na lista recebe as próximas posições, na ordem em que aparece na tabela."
              : ""
          }${divulgado ? " Como o resultado já foi divulgado, o e-mail de quem mudar fica pendente para reenvio." : ""}`}
          rotuloConfirmar="Confirmar"
          perigo={false}
          confirmando={processandoLote}
          onConfirmar={aplicarLote}
          onCancelar={() => setLoteStatus(null)}
        />
      )}
    </>
  );
}
