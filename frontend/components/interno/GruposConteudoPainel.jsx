"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import GrupoConteudoForm from "./GrupoConteudoForm";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import styles from "./AtividadesPainel.module.scss";

export default function GruposConteudoPainel({ edicaoId, gruposIniciais }) {
  const router = useRouter();
  const { notificar } = useToast();

  const [grupos, setGrupos] = useState(gruposIniciais);
  const [grupoEmEdicao, setGrupoEmEdicao] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);

  function abrirCriacao() {
    setGrupoEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(grupo) {
    setGrupoEmEdicao(grupo);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setGrupoEmEdicao(null);
  }

  function aoSalvar(grupoSalvo) {
    setGrupos((atual) => {
      const jaExiste = atual.some((item) => item.id === grupoSalvo.id);
      if (jaExiste) {
        return atual.map((item) => (item.id === grupoSalvo.id ? grupoSalvo : item));
      }
      return [...atual, grupoSalvo];
    });
    fecharModal();
    router.refresh();
  }

  async function excluirGrupo(id) {
    setProcessandoId(id);

    try {
      await apiClient.delete(`/edicoes/${edicaoId}/grupos-conteudo/${id}`);
      setGrupos((atual) => atual.filter((item) => item.id !== id));
      notificar("Grupo excluído com sucesso.");
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
          <h1 className={styles.titulo}>Comissões e Programas</h1>
          <p className={styles.descricao}>
            Cadastre os grupos (ex.: uma comissão ou "Programas de Pós-Graduação") e, dentro de
            cada um, as listas e os itens exibidos na página pública.
          </p>
        </div>
        <Botao type="button" onClick={abrirCriacao}>
          <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
          Novo grupo
        </Botao>
      </div>

      {grupos.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhum grupo cadastrado ainda.</p>
          <p className={styles.vazioApoio}>
            Crie o primeiro grupo para exibir a seção "Comissões e Programas" na página pública.
          </p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Listas</th>
                <th className={styles.colunaAcoes}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((grupo) => (
                <tr key={grupo.id}>
                  <td data-rotulo="Nome">{grupo.nome}</td>
                  <td data-rotulo="Listas">{grupo.listas?.length || 0}</td>
                  <td data-rotulo="Ações" className={styles.colunaAcoes}>
                    <div className={styles.acoesLinha}>
                      <button
                        type="button"
                        className={styles.botaoIcone}
                        aria-label={`Editar ${grupo.nome}`}
                        onClick={() => abrirEdicao(grupo)}
                      >
                        <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                        aria-label={`Excluir ${grupo.nome}`}
                        onClick={() => setConfirmandoId(grupo.id)}
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
        <Modal titulo={grupoEmEdicao ? "Editar grupo" : "Novo grupo"} onFechar={fecharModal}>
          <GrupoConteudoForm
            edicaoId={edicaoId}
            grupoInicial={grupoEmEdicao}
            aoSalvar={aoSalvar}
            aoCancelar={fecharModal}
            aoExcluir={excluirGrupo}
          />
        </Modal>
      )}

      {confirmandoId && (
        <ModalConfirmacao
          titulo="Excluir grupo"
          mensagem={`Tem certeza que deseja excluir "${grupos.find((grupo) => grupo.id === confirmandoId)?.nome}"? Essa ação também remove todas as listas e itens cadastrados nele e não pode ser desfeita.`}
          confirmando={processandoId === confirmandoId}
          onConfirmar={() => excluirGrupo(confirmandoId)}
          onCancelar={() => setConfirmandoId(null)}
        />
      )}
    </div>
  );
}
