"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, UserCheck, UserX } from "lucide-react";
import Botao from "@/components/forms/Botao";
import BuscaUsuario from "./BuscaUsuario";
import CartaoQrCode from "./CartaoQrCode";
import ModalConfirmacao from "./ModalConfirmacao";
import CabecalhoTabela, { LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import { useToast } from "./ToastProvider";
import { formatarIdentificacao } from "@/lib/identificacao";
import { formatarPeriodoAtividade } from "@/lib/publico";
import { credenciamentoAdmin } from "@/lib/credenciamento";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./CredenciamentoPainel.module.scss";

const ROTULOS_STATUS = { CONFIRMADA: "Confirmada", LISTA_ESPERA: "Lista de espera" };
const ROTULOS_ORIGEM = { QR_CODE: "QR code", EQUIPE: "Equipe" };

function formatarDataHora(valor) {
  return valor ? new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "";
}

const COLUNAS = [
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
    chave: "status",
    rotulo: "Inscrição",
    valor: (inscricao) => inscricao.status,
    filtro: "select",
    opcoes: Object.entries(ROTULOS_STATUS).map(([valor, rotulo]) => ({ valor, rotulo })),
    exportar: (inscricao) => ROTULOS_STATUS[inscricao.status],
  },
  {
    chave: "presente",
    rotulo: "Presença",
    valor: (inscricao) => (inscricao.presencaEm ? "SIM" : "NAO"),
    filtro: "select",
    opcoes: [
      { valor: "SIM", rotulo: "Presente" },
      { valor: "NAO", rotulo: "Sem presença" },
    ],
    exportar: (inscricao) => (inscricao.presencaEm ? "Presente" : "Sem presença"),
  },
  {
    chave: "presencaEm",
    rotulo: "Registrada em",
    valor: (inscricao) => (inscricao.presencaEm ? new Date(inscricao.presencaEm).getTime() : null),
    texto: (inscricao) => formatarDataHora(inscricao.presencaEm),
  },
  {
    chave: "origem",
    rotulo: "Origem",
    valor: (inscricao) => inscricao.presencaOrigem || null,
    filtro: "select",
    opcoes: Object.entries(ROTULOS_ORIGEM).map(([valor, rotulo]) => ({ valor, rotulo })),
    exportar: (inscricao) => ROTULOS_ORIGEM[inscricao.presencaOrigem] || "",
  },
  { chave: "por", rotulo: "Registrada por", valor: (inscricao) => inscricao.presencaRegistradaPor?.nome || null },
];

// Lista de presença de uma atividade: a equipe marca ou remove a presença de
// qualquer inscrito (inclusive da lista de espera, sem mudar a situação dele)
// e pode registrar quem nem se inscreveu.
export default function PresencaAtividade({ edicaoId, edicao, atividadeResumo, aoVoltar }) {
  const { notificar } = useToast();
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [selecionado, setSelecionado] = useState(null);
  const [adicionando, setAdicionando] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  const [removendo, setRemovendo] = useState(null);
  const tabela = useTabela(dados?.inscricoes || [], COLUNAS);

  useEffect(() => {
    credenciamentoAdmin
      .listarPresencas(edicaoId, atividadeResumo.id)
      .then(setDados)
      .catch((falha) => setErro(falha.message));
  }, [edicaoId, atividadeResumo.id]);

  function substituir(inscricao) {
    setDados((atual) => ({
      ...atual,
      inscricoes: atual.inscricoes.some((item) => item.id === inscricao.id)
        ? atual.inscricoes.map((item) => (item.id === inscricao.id ? inscricao : item))
        : [...atual.inscricoes, inscricao],
    }));
  }

  async function registrar(usuarioId) {
    try {
      const resposta = await credenciamentoAdmin.registrarPresenca(edicaoId, atividadeResumo.id, usuarioId);
      substituir(resposta.inscricao);
      notificar(resposta.mensagem);
      return true;
    } catch (falha) {
      notificar(falha.message, "erro");
      return false;
    }
  }

  async function adicionar() {
    setAdicionando(true);
    if (await registrar(selecionado.id)) setSelecionado(null);
    setAdicionando(false);
  }

  async function marcarLinha(inscricao) {
    setProcessandoId(inscricao.id);
    await registrar(inscricao.usuarioId);
    setProcessandoId(null);
  }

  async function remover() {
    setProcessandoId(removendo.id);
    try {
      const resposta = await credenciamentoAdmin.removerPresenca(edicaoId, atividadeResumo.id, removendo.usuarioId);
      substituir(resposta.inscricao);
      notificar(resposta.mensagem);
    } catch (falha) {
      notificar(falha.message, "erro");
    } finally {
      setProcessandoId(null);
      setRemovendo(null);
    }
  }

  const inscricoes = dados?.inscricoes || [];
  const atividade = dados?.atividade || atividadeResumo;

  return (
    <>
      <div>
        <button type="button" className={estilos.voltar} onClick={aoVoltar}>
          <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
          Voltar para as atividades
        </button>
      </div>

      <div>
        <h2 className={estilos.tituloAtividade}>{atividade.nome}</h2>
        <p className={styles.textoApoio}>
          {[formatarPeriodoAtividade(atividade.inicioAtividade, atividade.fimAtividade), atividade.local].filter(Boolean).join(" · ")}
        </p>
      </div>

      <CartaoQrCode
        titulo="QR code de presença"
        descricao={`Afixe no local da atividade. Funciona de 30 minutos antes do início até o fim, no horário de Brasília${
          dados?.atividade.janela ? (dados.atividade.janela.aberta ? " — aberto agora." : `: ${dados.atividade.janela.mensagem}`) : "."
        }`}
        evento={edicao.nome}
        nomeArquivo={`qr-${atividade.nome}`}
        carregar={() => credenciamentoAdmin.qrAtividade(edicaoId, atividadeResumo.id)}
        gerarNovo={() => credenciamentoAdmin.novoQrAtividade(edicaoId, atividadeResumo.id)}
      />

      <section className={estilos.credenciarBusca} aria-label="Registrar presença">
        <BuscaUsuario
          id="registrar-presenca"
          rotulo="Registrar presença"
          usuarioSelecionado={selecionado}
          onSelecionar={setSelecionado}
        />
        {selecionado && (
          <div>
            <Botao type="button" carregando={adicionando} onClick={adicionar}>
              <UserCheck size={18} strokeWidth={1.5} aria-hidden="true" />
              Registrar presença
            </Botao>
          </div>
        )}
        <p className={styles.textoApoio}>
          Quem não está inscrito é inscrito agora (sem vaga, fica na lista de espera, mas com a presença validada) e
          também é credenciado no evento.
        </p>
      </section>

      {erro ? (
        <div className={styles.vazio}>
          <p>{erro}</p>
        </div>
      ) : !dados ? (
        <div className={styles.vazio}>
          <p>Carregando...</p>
        </div>
      ) : inscricoes.length === 0 ? (
        <div className={styles.vazio}>
          <p>Ninguém inscrito nesta atividade ainda.</p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <BotaoExportarTabela tabela={tabela} nomeArquivo={`presenca-${atividade.nome}`} nomeAba="Presença" />
          <table className={styles.tabela}>
            <CabecalhoTabela tabela={tabela} idTabela="presenca-atividade" classeAcoes={styles.colunaAcoes} />
            <tbody>
              {tabela.linhasVisiveis.length === 0 && <LinhaSemResultado tabela={tabela} colSpan={COLUNAS.length + 1} />}
              {tabela.linhasVisiveis.map((inscricao) => (
                <tr key={inscricao.id}>
                  <td data-rotulo="Nome">{inscricao.usuario.nome}</td>
                  <td data-rotulo="E-mail">{inscricao.usuario.email}</td>
                  <td data-rotulo="CPF / Documento">{formatarIdentificacao(inscricao.usuario) || "—"}</td>
                  <td data-rotulo="Inscrição">{ROTULOS_STATUS[inscricao.status]}</td>
                  <td data-rotulo="Presença">{inscricao.presencaEm ? "Presente" : "—"}</td>
                  <td data-rotulo="Registrada em">{formatarDataHora(inscricao.presencaEm) || "—"}</td>
                  <td data-rotulo="Origem">{ROTULOS_ORIGEM[inscricao.presencaOrigem] || "—"}</td>
                  <td data-rotulo="Registrada por">{inscricao.presencaRegistradaPor?.nome || "—"}</td>
                  <td data-rotulo="Ações" className={styles.colunaAcoes}>
                    <div className={styles.acoesLinha}>
                      {inscricao.presencaEm ? (
                        <button
                          type="button"
                          className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                          aria-label={`Remover presença de ${inscricao.usuario.nome}`}
                          title="Remover presença"
                          disabled={processandoId === inscricao.id}
                          onClick={() => setRemovendo(inscricao)}
                        >
                          <UserX size={16} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.botaoIcone}
                          aria-label={`Registrar presença de ${inscricao.usuario.nome}`}
                          title="Registrar presença"
                          disabled={processandoId === inscricao.id}
                          onClick={() => marcarLinha(inscricao)}
                        >
                          <UserCheck size={16} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {removendo && (
        <ModalConfirmacao
          titulo="Remover presença"
          mensagem={`A presença de ${removendo.usuario.nome} nesta atividade será apagada. A inscrição continua.`}
          rotuloConfirmar="Remover"
          confirmando={processandoId === removendo.id}
          onConfirmar={remover}
          onCancelar={() => setRemovendo(null)}
        />
      )}
    </>
  );
}
