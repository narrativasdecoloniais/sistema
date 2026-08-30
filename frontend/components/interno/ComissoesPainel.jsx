"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import ComissaoForm from "./ComissaoForm";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import styles from "./ComissoesPainel.module.scss";

export default function ComissoesPainel({ edicaoId, comissoesIniciais, tiposComissao }) {
  const router = useRouter();
  const { notificar } = useToast();

  const [comissoes, setComissoes] = useState(comissoesIniciais);
  const [comissaoEmEdicao, setComissaoEmEdicao] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);

  function abrirCriacao() {
    setComissaoEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(comissao) {
    setComissaoEmEdicao(comissao);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setComissaoEmEdicao(null);
  }

  function aoSalvar(comissaoSalva) {
    setComissoes((atual) => {
      const jaExiste = atual.some((item) => item.id === comissaoSalva.id);
      if (jaExiste) {
        return atual.map((item) => (item.id === comissaoSalva.id ? comissaoSalva : item));
      }
      return [...atual, comissaoSalva];
    });
    fecharModal();
    router.refresh();
  }

  async function excluirComissao(id) {
    setProcessandoId(id);

    try {
      await apiClient.delete(`/edicoes/${edicaoId}/comissoes/${id}`);
      setComissoes((atual) => atual.filter((item) => item.id !== id));
      notificar("Comissão excluída com sucesso.");
      // Sem efeito quando chamado a partir da exclusão pela linha da tabela
      // (nenhum modal de edição aberto); fecha o formulário quando a
      // exclusão veio de dentro dele (ComissaoForm).
      fecharModal();
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessandoId(null);
      setConfirmandoId(null);
    }
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Comissões</h1>
          <p className={styles.descricao}>
            Cadastre as comissões organizadoras desta edição, exibidas na página pública logo
            após a seção Anais.
          </p>
        </div>
        <Botao type="button" onClick={abrirCriacao}>
          <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
          Nova comissão
        </Botao>
      </div>

      {comissoes.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhuma comissão cadastrada ainda.</p>
          <p className={styles.vazioApoio}>
            Crie a primeira comissão para exibir a seção na página pública.
          </p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Integrantes</th>
                <th className={styles.colunaAcoes}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {comissoes.map((comissao) => (
                <tr key={comissao.id}>
                  <td data-rotulo="Tipo">{comissao.tipoComissao?.nome}</td>
                  <td data-rotulo="Integrantes">{comissao.membros?.length || 0}</td>
                  <td data-rotulo="Ações" className={styles.colunaAcoes}>
                    <div className={styles.acoesLinha}>
                      <button
                        type="button"
                        className={styles.botaoIcone}
                        aria-label={`Editar comissão de ${comissao.tipoComissao?.nome}`}
                        onClick={() => abrirEdicao(comissao)}
                      >
                        <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                        aria-label={`Excluir comissão de ${comissao.tipoComissao?.nome}`}
                        onClick={() => setConfirmandoId(comissao.id)}
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
        <Modal
          titulo={comissaoEmEdicao ? "Editar comissão" : "Nova comissão"}
          onFechar={fecharModal}
        >
          <ComissaoForm
            edicaoId={edicaoId}
            comissaoInicial={comissaoEmEdicao}
            tiposComissao={tiposComissao}
            aoSalvar={aoSalvar}
            aoCancelar={fecharModal}
            aoExcluir={excluirComissao}
          />
        </Modal>
      )}

      {confirmandoId && (
        <ModalConfirmacao
          titulo="Excluir comissão"
          mensagem={`Tem certeza que deseja excluir a comissão "${comissoes.find((comissao) => comissao.id === confirmandoId)?.tipoComissao?.nome}"? Essa ação não pode ser desfeita.`}
          confirmando={processandoId === confirmandoId}
          onConfirmar={() => excluirComissao(confirmandoId)}
          onCancelar={() => setConfirmandoId(null)}
        />
      )}
    </div>
  );
}
