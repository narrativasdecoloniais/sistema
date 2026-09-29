"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserX } from "lucide-react";
import Botao from "@/components/forms/Botao";
import BuscaUsuario from "./BuscaUsuario";
import CartaoQrCode from "./CartaoQrCode";
import CartoesContadores from "./CartoesContadores";
import ModalConfirmacao from "./ModalConfirmacao";
import CabecalhoTabela, { LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import { useToast } from "./ToastProvider";
import { formatarIdentificacao } from "@/lib/identificacao";
import { credenciamentoAdmin } from "@/lib/credenciamento";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./CredenciamentoPainel.module.scss";

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

export default function CredenciamentoEventoAba({ edicaoId, dadosIniciais }) {
  const router = useRouter();
  const { notificar } = useToast();
  const [inscricoes, setInscricoes] = useState(dadosIniciais.inscricoes);
  const [selecionado, setSelecionado] = useState(null);
  const [credenciando, setCredenciando] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  const [desfazendo, setDesfazendo] = useState(null);
  const tabela = useTabela(inscricoes, COLUNAS);
  const { edicao } = dadosIniciais;

  function substituir(inscricao) {
    setInscricoes((atual) =>
      atual.some((item) => item.id === inscricao.id)
        ? atual.map((item) => (item.id === inscricao.id ? inscricao : item))
        : [...atual, inscricao]
    );
  }

  async function credenciar(usuarioId, aoTerminar) {
    try {
      const resposta = await credenciamentoAdmin.credenciar(edicaoId, usuarioId);
      substituir(resposta.inscricao);
      notificar(resposta.mensagem);
      aoTerminar?.();
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
    }
  }

  async function credenciarSelecionado() {
    setCredenciando(true);
    await credenciar(selecionado.id, () => setSelecionado(null));
    setCredenciando(false);
  }

  async function credenciarLinha(inscricao) {
    setProcessandoId(inscricao.id);
    await credenciar(inscricao.usuarioId);
    setProcessandoId(null);
  }

  async function desfazer() {
    setProcessandoId(desfazendo.id);
    try {
      const resposta = await credenciamentoAdmin.desfazer(edicaoId, desfazendo.usuarioId);
      substituir(resposta.inscricao);
      notificar(resposta.mensagem);
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessandoId(null);
      setDesfazendo(null);
    }
  }

  const credenciados = inscricoes.filter((inscricao) => inscricao.credenciadoEm);

  return (
    <>
      <CartaoQrCode
        titulo="QR code do credenciamento no evento"
        descricao={`Afixe na entrada. Cada pessoa lê em Credenciamento, na área do participante (ou com a câmera do celular); quem ainda não tem inscrição é inscrito na hora. Funciona só nos dias do evento, no horário de Brasília${
          edicao.janela.aberta ? " — aberto agora." : `: ${edicao.janela.mensagem}`
        }`}
        evento={edicao.nome}
        nomeArquivo="qr-credenciamento-evento"
        carregar={() => credenciamentoAdmin.qrEvento(edicaoId)}
        gerarNovo={() => credenciamentoAdmin.novoQrEvento(edicaoId)}
      />

      <CartoesContadores
        itens={[
          { rotulo: "Inscritos", valor: inscricoes.length },
          { rotulo: "Credenciados", valor: credenciados.length },
          { rotulo: "Pelo QR code", valor: credenciados.filter((item) => item.credenciamentoOrigem === "QR_CODE").length },
          { rotulo: "Pela equipe", valor: credenciados.filter((item) => item.credenciamentoOrigem === "EQUIPE").length },
        ]}
      />

      <section className={estilos.credenciarBusca} aria-label="Credenciar participante">
        <BuscaUsuario
          id="credenciar-participante"
          rotulo="Credenciar participante"
          usuarioSelecionado={selecionado}
          onSelecionar={setSelecionado}
        />
        {selecionado && (
          <div>
            <Botao type="button" carregando={credenciando} onClick={credenciarSelecionado}>
              <UserCheck size={18} strokeWidth={1.5} aria-hidden="true" />
              Credenciar
            </Botao>
          </div>
        )}
        <p className={styles.textoApoio}>Quem ainda não tem inscrição geral é inscrito ao ser credenciado.</p>
      </section>

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
          onConfirmar={desfazer}
          onCancelar={() => setDesfazendo(null)}
        />
      )}
    </>
  );
}
