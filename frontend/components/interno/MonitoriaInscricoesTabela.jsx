"use client";

import { useMemo, useState } from "react";
import { Eye, UserCheck, ListOrdered, UserX } from "lucide-react";
import ModalConfirmacao from "./ModalConfirmacao";
import DetalheInscricaoMonitoriaModal from "./DetalheInscricaoMonitoriaModal";
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

const simNao = (valor) => (valor ? "SIM" : "NAO");

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
  const idade = (inscricao) => idadeEm(inscricao.dataNascimento, referencia);
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
      texto: (inscricao) => `${idade(inscricao)}${idade(inscricao) < 18 ? " (menor)" : ""}`,
    },
    {
      chave: "menor",
      rotulo: "Autorização (menor)",
      valor: (inscricao) => (idade(inscricao) >= 18 ? "NAO_SE_APLICA" : inscricao.temAutorizacao ? "ANEXADA" : "FALTANDO"),
      filtro: "select",
      opcoes: [
        { valor: "ANEXADA", rotulo: "Anexada" },
        { valor: "FALTANDO", rotulo: "Faltando" },
        { valor: "NAO_SE_APLICA", rotulo: "Não se aplica" },
      ],
      exportar: (inscricao) =>
        idade(inscricao) >= 18 ? "Não se aplica" : inscricao.temAutorizacao ? "Anexada" : "Faltando",
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
      exportar: (inscricao) => (inscricao.experienciaAnterior ? "Sim" : "Não"),
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
      exportar: (inscricao) => (inscricao.precisaAdaptacao ? "Sim" : "Não"),
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
      chave: "inscritoEm",
      rotulo: "Inscrito em",
      valor: (inscricao) => new Date(inscricao.createdAt).getTime(),
      texto: (inscricao) => formatarData(inscricao.createdAt),
    },
  ];
}

export default function MonitoriaInscricoesTabela({ edicaoId, edicao, inscricoes, recarregar }) {
  const { notificar } = useToast();
  const colunas = useMemo(() => montarColunas(edicao, inscricoes), [edicao, inscricoes]);
  const tabela = useTabela(inscricoes, colunas);
  const selecao = useSelecaoLinhas(tabela);
  const [detalheId, setDetalheId] = useState(null);
  const [loteStatus, setLoteStatus] = useState(null);
  const [processandoLote, setProcessandoLote] = useState(false);

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

  if (inscricoes.length === 0) {
    return (
      <div className={styles.vazio}>
        <p>Nenhuma inscrição de monitoria ainda.</p>
        <p className={styles.vazioApoio}>
          As inscrições aparecem aqui conforme as pessoas se inscrevem pela área do participante, dentro do período
          definido em Configurações.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.tabelaWrapper}>
        <BotaoExportarTabela tabela={tabela} nomeArquivo="monitoria" nomeAba="Monitoria">
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
              const idade = idadeEm(inscricao.dataNascimento, referencia);
              return (
                <tr key={inscricao.id}>
                  <CelulaSelecao selecao={selecao} id={inscricao.id} rotulo={`Selecionar ${inscricao.usuario.nome}`} />
                  <td data-rotulo="Nome">{inscricao.usuario.nome}</td>
                  <td data-rotulo="E-mail">{inscricao.usuario.email}</td>
                  <td data-rotulo="CPF / Documento">{formatarIdentificacao(inscricao.usuario) || "—"}</td>
                  <td data-rotulo="Idade no evento">
                    {idade}
                    {idade < 18 && <span className={styles.textoSuave}> (menor)</span>}
                  </td>
                  <td data-rotulo="Autorização (menor)">
                    {idade >= 18 ? (
                      <span className={styles.textoSuave}>Não se aplica</span>
                    ) : inscricao.temAutorizacao ? (
                      "Anexada"
                    ) : (
                      <strong>Faltando</strong>
                    )}
                  </td>
                  <td data-rotulo="Telefone">{inscricao.telefone}</td>
                  <td data-rotulo="Pronome">{inscricao.pronome || "—"}</td>
                  <td data-rotulo="Curso e instituição">{inscricao.cursoInstituicao}</td>
                  <td data-rotulo="Experiência anterior">{inscricao.experienciaAnterior ? "Sim" : "Não"}</td>
                  <td data-rotulo="Atividades de interesse">{inscricao.funcoes.join("; ")}</td>
                  <td data-rotulo="Precisa de adaptação">{inscricao.precisaAdaptacao ? "Sim" : "Não"}</td>
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
