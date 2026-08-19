"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import ModalidadeSubmissaoForm from "./ModalidadeSubmissaoForm";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import styles from "./AtividadesPainel.module.scss";

export default function ModalidadesSubmissaoPainel({ edicaoId, modalidadesIniciais }) {
  const router = useRouter();
  const { notificar } = useToast();

  const [modalidades, setModalidades] = useState(modalidadesIniciais);
  const [modalidadeEmEdicao, setModalidadeEmEdicao] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);

  function abrirCriacao() {
    setModalidadeEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(modalidade) {
    setModalidadeEmEdicao(modalidade);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setModalidadeEmEdicao(null);
  }

  function aoSalvar(modalidadeSalva) {
    setModalidades((atual) => {
      const jaExiste = atual.some((item) => item.id === modalidadeSalva.id);
      if (jaExiste) {
        return atual.map((item) => (item.id === modalidadeSalva.id ? modalidadeSalva : item));
      }
      return [...atual, modalidadeSalva];
    });
    fecharModal();
    router.refresh();
  }

  async function excluirModalidade(id) {
    setProcessandoId(id);

    try {
      await apiClient.delete(`/edicoes/${edicaoId}/modalidades-submissao/${id}`);
      setModalidades((atual) => atual.filter((item) => item.id !== id));
      notificar("Modalidade excluída com sucesso.");
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
          <h1 className={styles.titulo}>Modalidades de submissão</h1>
          <p className={styles.descricao}>
            Cadastre as modalidades de submissão desta edição e, dentro de cada uma, as áreas
            temáticas exibidas na página pública.
          </p>
        </div>
        <Botao type="button" onClick={abrirCriacao}>
          <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
          Nova modalidade
        </Botao>
      </div>

      {modalidades.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhuma modalidade de submissão cadastrada ainda.</p>
          <p className={styles.vazioApoio}>
            Crie a primeira modalidade para exibi-la na página pública de submissão.
          </p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Slug</th>
                <th>Áreas</th>
                <th className={styles.colunaAcoes}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {modalidades.map((modalidade) => (
                <tr key={modalidade.id}>
                  <td data-rotulo="Nome">{modalidade.nome}</td>
                  <td data-rotulo="Slug">{modalidade.slug}</td>
                  <td data-rotulo="Áreas">{modalidade.areas?.length || 0}</td>
                  <td data-rotulo="Ações" className={styles.colunaAcoes}>
                    <div className={styles.acoesLinha}>
                      <button
                        type="button"
                        className={styles.botaoIcone}
                        aria-label={`Editar ${modalidade.nome}`}
                        onClick={() => abrirEdicao(modalidade)}
                      >
                        <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                        aria-label={`Excluir ${modalidade.nome}`}
                        onClick={() => setConfirmandoId(modalidade.id)}
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
          titulo={modalidadeEmEdicao ? "Editar modalidade" : "Nova modalidade"}
          onFechar={fecharModal}
        >
          <ModalidadeSubmissaoForm
            edicaoId={edicaoId}
            modalidadeInicial={modalidadeEmEdicao}
            aoSalvar={aoSalvar}
            aoCancelar={fecharModal}
            aoExcluir={excluirModalidade}
          />
        </Modal>
      )}

      {confirmandoId && (
        <ModalConfirmacao
          titulo="Excluir modalidade"
          mensagem={`Tem certeza que deseja excluir "${modalidades.find((modalidade) => modalidade.id === confirmandoId)?.nome}"? Essa ação também remove todas as áreas e pessoas cadastradas nela e não pode ser desfeita.`}
          confirmando={processandoId === confirmandoId}
          onConfirmar={() => excluirModalidade(confirmandoId)}
          onCancelar={() => setConfirmandoId(null)}
        />
      )}
    </div>
  );
}
