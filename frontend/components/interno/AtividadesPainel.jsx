"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import AtividadeForm from "./AtividadeForm";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import styles from "./AtividadesPainel.module.scss";

export default function AtividadesPainel({ edicaoId, atividadesIniciais, tiposAtividade, tiposParticipacao }) {
  const router = useRouter();
  const { notificar } = useToast();

  const [atividades, setAtividades] = useState(atividadesIniciais);
  const [atividadeEmEdicao, setAtividadeEmEdicao] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);

  function abrirCriacao() {
    setAtividadeEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(atividade) {
    setAtividadeEmEdicao(atividade);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setAtividadeEmEdicao(null);
  }

  function aoSalvar(atividadeSalva) {
    setAtividades((atual) => {
      const jaExiste = atual.some((item) => item.id === atividadeSalva.id);
      if (jaExiste) {
        return atual.map((item) => (item.id === atividadeSalva.id ? atividadeSalva : item));
      }
      return [...atual, atividadeSalva];
    });
    fecharModal();
    router.refresh();
  }

  async function excluirAtividade(id) {
    setProcessandoId(id);

    try {
      await apiClient.delete(`/edicoes/${edicaoId}/atividades/${id}`);
      setAtividades((atual) => atual.filter((item) => item.id !== id));
      notificar("Atividade excluída com sucesso.");
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
          <h1 className={styles.titulo}>Atividades</h1>
          <p className={styles.descricao}>
            Cadastre as atividades desta edição para depois configurar vagas, lista de espera e
            conflitos de horário das inscrições.
          </p>
        </div>
        <Botao type="button" onClick={abrirCriacao}>
          <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
          Nova atividade
        </Botao>
      </div>

      {atividades.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhuma atividade cadastrada ainda.</p>
          <p className={styles.vazioApoio}>
            Crie a primeira atividade para liberar as inscrições desta edição.
          </p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Slug</th>
                <th>Vagas</th>
                <th>Pessoas</th>
                <th className={styles.colunaAcoes}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {atividades.map((atividade) => (
                <tr key={atividade.id}>
                  <td data-rotulo="Nome">{atividade.nome}</td>
                  <td data-rotulo="Tipo">{atividade.tipoAtividade?.nome}</td>
                  <td data-rotulo="Slug">{atividade.slug}</td>
                  <td data-rotulo="Vagas">
                    {!atividade.exigeInscricao
                      ? "Sem inscrição"
                      : atividade.semLimiteVagas
                        ? "Ilimitado"
                        : atividade.vagas}
                  </td>
                  <td data-rotulo="Pessoas">{atividade.pessoas?.length || 0}</td>
                  <td data-rotulo="Ações" className={styles.colunaAcoes}>
                    <div className={styles.acoesLinha}>
                      <button
                        type="button"
                        className={styles.botaoIcone}
                        aria-label={`Editar ${atividade.nome}`}
                        onClick={() => abrirEdicao(atividade)}
                      >
                        <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                        aria-label={`Excluir ${atividade.nome}`}
                        onClick={() => setConfirmandoId(atividade.id)}
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
          titulo={atividadeEmEdicao ? "Editar atividade" : "Nova atividade"}
          onFechar={fecharModal}
        >
          <AtividadeForm
            edicaoId={edicaoId}
            atividadeInicial={atividadeEmEdicao}
            tiposAtividade={tiposAtividade}
            tiposParticipacao={tiposParticipacao}
            aoSalvar={aoSalvar}
            aoCancelar={fecharModal}
          />
        </Modal>
      )}

      {confirmandoId && (
        <ModalConfirmacao
          titulo="Excluir atividade"
          mensagem={`Tem certeza que deseja excluir "${atividades.find((atividade) => atividade.id === confirmandoId)?.nome}"? Essa ação não pode ser desfeita.`}
          confirmando={processandoId === confirmandoId}
          onConfirmar={() => excluirAtividade(confirmandoId)}
          onCancelar={() => setConfirmandoId(null)}
        />
      )}
    </div>
  );
}
