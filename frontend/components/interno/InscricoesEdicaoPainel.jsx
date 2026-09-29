"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import InscricaoEdicaoForm from "./InscricaoEdicaoForm";
import CartoesContadores from "./CartoesContadores";
import CabecalhoTabela, { LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { formatarIdentificacao } from "@/lib/identificacao";
import styles from "./InscricoesEdicaoPainel.module.scss";

function formatarData(valor) {
  return new Date(valor).toLocaleDateString("pt-BR", {
    dateStyle: "short",
  });
}

const COLUNAS = [
  { chave: "nome", rotulo: "Nome", valor: (inscricao) => inscricao.usuario.nome },
  { chave: "email", rotulo: "E-mail", valor: (inscricao) => inscricao.usuario.email },
  {
    chave: "cpf",
    rotulo: "CPF / Documento",
    valor: (inscricao) => inscricao.usuario.cpf || inscricao.usuario.documentoEstrangeiro || null,
    // Aceita busca com ou sem pontuação (e pelo país, no caso de estrangeiro).
    texto: (inscricao) =>
      formatarIdentificacao(inscricao.usuario)
        ? `${formatarIdentificacao(inscricao.usuario)} ${inscricao.usuario.cpf || ""}`
        : "",
    exportar: (inscricao) => formatarIdentificacao(inscricao.usuario) || "",
  },
  { chave: "instituicao", rotulo: "Instituição", valor: (inscricao) => inscricao.usuario.instituicao || null },
  {
    chave: "inscritoEm",
    rotulo: "Inscrito em",
    valor: (inscricao) => new Date(inscricao.createdAt).getTime(),
    texto: (inscricao) => formatarData(inscricao.createdAt),
  },
];

export default function InscricoesEdicaoPainel({ edicaoId, inscricoesIniciais }) {
  const router = useRouter();
  const { notificar } = useToast();

  const [inscricoes, setInscricoes] = useState(inscricoesIniciais);
  const tabela = useTabela(inscricoes, COLUNAS);
  const [modalAberto, setModalAberto] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);

  function fecharModal() {
    setModalAberto(false);
  }

  function aoSalvar(inscricaoSalva) {
    setInscricoes((atual) => [...atual, inscricaoSalva]);
    fecharModal();
    router.refresh();
  }

  async function excluirInscricao(id) {
    setProcessandoId(id);

    try {
      await apiClient.delete(`/edicoes/${edicaoId}/inscricoes-gerais/${id}`);
      setInscricoes((atual) => atual.filter((item) => item.id !== id));
      notificar("Inscrição excluída com sucesso.");
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessandoId(null);
      setConfirmandoId(null);
    }
  }

  const inscricaoEmConfirmacao = inscricoes.find((item) => item.id === confirmandoId);

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Inscrições gerais</h1>
          <p className={styles.descricao}>
            Quem está inscrito nesta edição como um todo, independente de atividades
            específicas.
          </p>
        </div>
        <Botao type="button" onClick={() => setModalAberto(true)}>
          <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
          Adicionar inscrição
        </Botao>
      </div>

      <CartoesContadores itens={[{ rotulo: "Total de inscritos", valor: inscricoes.length }]} />

      {inscricoes.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhuma inscrição geral ainda.</p>
          <p className={styles.vazioApoio}>
            As inscrições aparecem aqui conforme as pessoas se inscrevem pelo site público, ou
            você pode adicionar uma manualmente.
          </p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <BotaoExportarTabela tabela={tabela} nomeArquivo="inscricoes-gerais" nomeAba="Inscrições gerais" />
          <table className={styles.tabela}>
            <CabecalhoTabela tabela={tabela} idTabela="inscricoes-edicao" classeAcoes={styles.colunaAcoes} />
            <tbody>
              {tabela.linhasVisiveis.length === 0 && (
                <LinhaSemResultado tabela={tabela} colSpan={COLUNAS.length + 1} />
              )}
              {tabela.linhasVisiveis.map((inscricao) => (
                <tr key={inscricao.id}>
                  <td data-rotulo="Nome">{inscricao.usuario.nome}</td>
                  <td data-rotulo="E-mail">{inscricao.usuario.email}</td>
                  <td data-rotulo="CPF / Documento">
                    {formatarIdentificacao(inscricao.usuario) || "—"}
                  </td>
                  <td data-rotulo="Instituição">{inscricao.usuario.instituicao || "—"}</td>
                  <td data-rotulo="Inscrito em">{formatarData(inscricao.createdAt)}</td>
                  <td data-rotulo="Ações" className={styles.colunaAcoes}>
                    <div className={styles.acoesLinha}>
                      <button
                        type="button"
                        className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                        aria-label={`Excluir inscrição de ${inscricao.usuario.nome}`}
                        onClick={() => setConfirmandoId(inscricao.id)}
                      >
                        <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <Modal titulo="Adicionar inscrição" onFechar={fecharModal}>
          <InscricaoEdicaoForm edicaoId={edicaoId} aoSalvar={aoSalvar} aoCancelar={fecharModal} />
        </Modal>
      )}

      {confirmandoId && (
        <ModalConfirmacao
          titulo="Excluir inscrição"
          mensagem={`Tem certeza que deseja excluir a inscrição de "${inscricaoEmConfirmacao?.usuario.nome}"? Isso também remove as inscrições dela em atividades específicas desta edição. Essa ação não pode ser desfeita.`}
          confirmando={processandoId === confirmandoId}
          onConfirmar={() => excluirInscricao(confirmandoId)}
          onCancelar={() => setConfirmandoId(null)}
        />
      )}
    </div>
  );
}
