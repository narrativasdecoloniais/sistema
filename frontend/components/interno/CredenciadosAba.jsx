"use client";

import { useState } from "react";
import { UserCheck, UserX } from "lucide-react";
import ModalConfirmacao from "./ModalConfirmacao";
import CabecalhoTabela, { LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import { formatarIdentificacao } from "@/lib/identificacao";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";

const ROTULOS_ORIGEM = { QR_CODE: "QR code", EQUIPE: "Equipe", CRACHA: "Crachá" };

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
    chave: "credenciado",
    rotulo: "Credenciado",
    valor: (inscricao) => (inscricao.credenciadoEm ? "SIM" : "NAO"),
    filtro: "select",
    opcoes: [
      { valor: "SIM", rotulo: "Sim" },
      { valor: "NAO", rotulo: "Não" },
    ],
    exportar: (inscricao) => (inscricao.credenciadoEm ? "Sim" : "Não"),
  },
  {
    chave: "credenciadoEm",
    rotulo: "Credenciado em",
    valor: (inscricao) => (inscricao.credenciadoEm ? new Date(inscricao.credenciadoEm).getTime() : null),
    texto: (inscricao) => formatarDataHora(inscricao.credenciadoEm),
  },
  {
    chave: "origem",
    rotulo: "Origem",
    valor: (inscricao) => inscricao.credenciamentoOrigem || null,
    filtro: "select",
    opcoes: Object.entries(ROTULOS_ORIGEM).map(([valor, rotulo]) => ({ valor, rotulo })),
    exportar: (inscricao) => ROTULOS_ORIGEM[inscricao.credenciamentoOrigem] || "",
  },
  { chave: "por", rotulo: "Registrado por", valor: (inscricao) => inscricao.credenciadoPor?.nome || null },
];

// Todas as inscrições gerais da edição, credenciadas ou não, com credenciar e
// desfazer por linha (o estado mora em CredenciamentoPainel).
export default function CredenciadosAba({ inscricoes, aoCredenciar, aoDesfazer }) {
  const [processandoId, setProcessandoId] = useState(null);
  const [desfazendo, setDesfazendo] = useState(null);
  const tabela = useTabela(inscricoes, COLUNAS);

  async function credenciarLinha(inscricao) {
    setProcessandoId(inscricao.id);
    await aoCredenciar(inscricao.usuarioId);
    setProcessandoId(null);
  }

  async function confirmarDesfazer() {
    setProcessandoId(desfazendo.id);
    await aoDesfazer(desfazendo.usuarioId);
    setProcessandoId(null);
    setDesfazendo(null);
  }

  return (
    <>
      {inscricoes.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhuma inscrição nesta edição ainda.</p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <BotaoExportarTabela tabela={tabela} nomeArquivo="credenciamento-evento" nomeAba="Credenciamento" />
          <table className={styles.tabela}>
            <CabecalhoTabela tabela={tabela} idTabela="credenciamento-evento" classeAcoes={styles.colunaAcoes} />
            <tbody>
              {tabela.linhasVisiveis.length === 0 && <LinhaSemResultado tabela={tabela} colSpan={COLUNAS.length + 1} />}
              {tabela.linhasVisiveis.map((inscricao) => (
                <tr key={inscricao.id}>
                  <td data-rotulo="Nome">{inscricao.usuario.nome}</td>
                  <td data-rotulo="E-mail">{inscricao.usuario.email}</td>
                  <td data-rotulo="CPF / Documento">{formatarIdentificacao(inscricao.usuario) || "—"}</td>
                  <td data-rotulo="Credenciado">{inscricao.credenciadoEm ? "Sim" : "Não"}</td>
                  <td data-rotulo="Credenciado em">{formatarDataHora(inscricao.credenciadoEm) || "—"}</td>
                  <td data-rotulo="Origem">{ROTULOS_ORIGEM[inscricao.credenciamentoOrigem] || "—"}</td>
                  <td data-rotulo="Registrado por">{inscricao.credenciadoPor?.nome || "—"}</td>
                  <td data-rotulo="Ações" className={styles.colunaAcoes}>
                    <div className={styles.acoesLinha}>
                      {inscricao.credenciadoEm ? (
                        <button
                          type="button"
                          className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                          aria-label={`Desfazer credenciamento de ${inscricao.usuario.nome}`}
                          title="Desfazer credenciamento"
                          disabled={processandoId === inscricao.id}
                          onClick={() => setDesfazendo(inscricao)}
                        >
                          <UserX size={16} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.botaoIcone}
                          aria-label={`Credenciar ${inscricao.usuario.nome}`}
                          title="Credenciar"
                          disabled={processandoId === inscricao.id}
                          onClick={() => credenciarLinha(inscricao)}
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

      {desfazendo && (
        <ModalConfirmacao
          titulo="Desfazer credenciamento"
          mensagem={`O credenciamento de ${desfazendo.usuario.nome} no evento será apagado. A inscrição e as presenças nas atividades continuam.`}
          rotuloConfirmar="Desfazer"
          confirmando={processandoId === desfazendo.id}
          onConfirmar={confirmarDesfazer}
          onCancelar={() => setDesfazendo(null)}
        />
      )}
    </>
  );
}
