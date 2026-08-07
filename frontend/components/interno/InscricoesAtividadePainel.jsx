"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowUpCircle, Clock } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import CampoSelecao from "./CampoSelecao";
import InscricaoAtividadeForm from "./InscricaoAtividadeForm";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import styles from "./InscricoesAtividadePainel.module.scss";

function formatarData(valor) {
  return new Date(valor).toLocaleDateString("pt-BR", { dateStyle: "short" });
}

const ROTULO_STATUS = {
  CONFIRMADA: "Confirmada",
  LISTA_ESPERA: "Lista de espera",
};

export default function InscricoesAtividadePainel({ edicaoId, inscricoesIniciais, atividades }) {
  const router = useRouter();
  const { notificar } = useToast();

  const [inscricoes, setInscricoes] = useState(inscricoesIniciais);
  const [filtroAtividadeId, setFiltroAtividadeId] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);

  const inscricoesFiltradas = useMemo(
    () =>
      filtroAtividadeId
        ? inscricoes.filter((item) => item.atividade.id === filtroAtividadeId)
        : inscricoes,
    [inscricoes, filtroAtividadeId]
  );

  function fecharModal() {
    setModalAberto(false);
  }

  function aoSalvar(inscricaoSalva) {
    setInscricoes((atual) => [...atual, inscricaoSalva]);
    fecharModal();
    router.refresh();
  }

  async function alternarStatus(inscricao) {
    const novoStatus = inscricao.status === "CONFIRMADA" ? "LISTA_ESPERA" : "CONFIRMADA";
    setProcessandoId(inscricao.id);

    try {
      const resposta = await apiClient.patch(
        `/edicoes/${edicaoId}/inscricoes-atividades/${inscricao.id}`,
        { status: novoStatus }
      );
      setInscricoes((atual) =>
        atual.map((item) => (item.id === inscricao.id ? resposta.inscricao : item))
      );
      notificar("Status atualizado com sucesso.");
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessandoId(null);
    }
  }

  async function excluirInscricao(id) {
    setProcessandoId(id);

    try {
      await apiClient.delete(`/edicoes/${edicaoId}/inscricoes-atividades/${id}`);
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
          <h1 className={styles.titulo}>Inscrições em atividades</h1>
          <p className={styles.descricao}>
            Quem está inscrito em cada atividade que exige inscrição, com confirmação ou lista
            de espera.
          </p>
        </div>
        <Botao type="button" onClick={() => setModalAberto(true)}>
          <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
          Adicionar inscrição
        </Botao>
      </div>

      <div className={styles.filtro}>
        <CampoSelecao
          id="filtroAtividade"
          rotulo="Filtrar por atividade"
          value={filtroAtividadeId}
          onChange={(evento) => setFiltroAtividadeId(evento.target.value)}
        >
          <option value="">Todas as atividades</option>
          {atividades.map((atividade) => (
            <option key={atividade.id} value={atividade.id}>
              {atividade.nome}
            </option>
          ))}
        </CampoSelecao>
      </div>

      {inscricoesFiltradas.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhuma inscrição em atividade encontrada.</p>
          <p className={styles.vazioApoio}>
            {inscricoes.length === 0
              ? "As inscrições aparecem aqui conforme as pessoas se inscrevem pelo site público, ou você pode adicionar uma manualmente."
              : "Nenhuma inscrição para a atividade selecionada."}
          </p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Atividade</th>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Status</th>
                <th>Inscrito em</th>
                <th className={styles.colunaAcoes}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {inscricoesFiltradas.map((inscricao) => (
                <tr key={inscricao.id}>
                  <td data-rotulo="Atividade">{inscricao.atividade.nome}</td>
                  <td data-rotulo="Nome">{inscricao.usuario.nome}</td>
                  <td data-rotulo="E-mail">{inscricao.usuario.email}</td>
                  <td data-rotulo="Status">
                    <span
                      className={`${styles.tag} ${
                        inscricao.status === "CONFIRMADA" ? styles.tagConfirmada : styles.tagEspera
                      }`}
                    >
                      {ROTULO_STATUS[inscricao.status]}
                    </span>
                  </td>
                  <td data-rotulo="Inscrito em">{formatarData(inscricao.createdAt)}</td>
                  <td data-rotulo="Ações" className={styles.colunaAcoes}>
                    <div className={styles.acoesLinha}>
                      <button
                        type="button"
                        className={styles.botaoIcone}
                        aria-label={
                          inscricao.status === "CONFIRMADA"
                            ? `Mover ${inscricao.usuario.nome} para lista de espera`
                            : `Confirmar inscrição de ${inscricao.usuario.nome}`
                        }
                        disabled={processandoId === inscricao.id}
                        onClick={() => alternarStatus(inscricao)}
                      >
                        {inscricao.status === "CONFIRMADA" ? (
                          <Clock size={16} strokeWidth={1.5} aria-hidden="true" />
                        ) : (
                          <ArrowUpCircle size={16} strokeWidth={1.5} aria-hidden="true" />
                        )}
                      </button>
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
          <InscricaoAtividadeForm
            edicaoId={edicaoId}
            atividades={atividades}
            atividadeIdInicial={filtroAtividadeId}
            aoSalvar={aoSalvar}
            aoCancelar={fecharModal}
          />
        </Modal>
      )}

      {confirmandoId && (
        <ModalConfirmacao
          titulo="Excluir inscrição"
          mensagem={`Tem certeza que deseja excluir a inscrição de "${inscricaoEmConfirmacao?.usuario.nome}" em "${inscricaoEmConfirmacao?.atividade.nome}"? Essa ação não pode ser desfeita.`}
          confirmando={processandoId === confirmandoId}
          onConfirmar={() => excluirInscricao(confirmandoId)}
          onCancelar={() => setConfirmandoId(null)}
        />
      )}
    </div>
  );
}
