"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, ShieldPlus } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import OrganizadorForm from "./OrganizadorForm";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { formatarCpf } from "@/lib/cpf";
import styles from "./OrganizadoresPainel.module.scss";

export default function OrganizadoresPainel({ organizadoresIniciais }) {
  const router = useRouter();
  const { notificar } = useToast();

  const [organizadores, setOrganizadores] = useState(organizadoresIniciais);
  const [modalAberto, setModalAberto] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  const [confirmando, setConfirmando] = useState(null);

  function fecharModal() {
    setModalAberto(false);
  }

  function aoSalvar(organizadorSalvo) {
    setOrganizadores((atual) => [...atual, organizadorSalvo]);
    fecharModal();
    router.refresh();
  }

  async function removerOrganizador(id) {
    setProcessandoId(id);

    try {
      await apiClient.delete(`/organizadores/${id}`);
      setOrganizadores((atual) => atual.filter((item) => item.id !== id));
      notificar("Organizador removido com sucesso.");
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessandoId(null);
      setConfirmando(null);
    }
  }

  async function promoverAdmin(id) {
    setProcessandoId(id);

    try {
      const resposta = await apiClient.patch(`/organizadores/${id}/promover`, {});
      setOrganizadores((atual) =>
        atual.map((item) => (item.id === id ? resposta.organizador : item))
      );
      notificar("Organizador promovido a administrador.");
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessandoId(null);
      setConfirmando(null);
    }
  }

  const organizadorEmConfirmacao = confirmando
    ? organizadores.find((item) => item.id === confirmando.id)
    : null;

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Organizadores</h1>
          <p className={styles.descricao}>
            Administradores têm acesso total ao Narrativas; organizadores podem ser promovidos a
            administrador por aqui.
          </p>
        </div>
        <Botao type="button" onClick={() => setModalAberto(true)}>
          <UserPlus size={18} strokeWidth={1.5} aria-hidden="true" />
          Adicionar organizador
        </Botao>
      </div>

      {organizadores.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhum organizador cadastrado ainda.</p>
          <p className={styles.vazioApoio}>
            Adicione alguém para dividir a gestão do Narrativas com você.
          </p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>CPF</th>
                <th>Papel</th>
                <th className={styles.colunaAcoes}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {organizadores.map((organizador) => {
                const eAdmin = organizador.papeis.includes("ADMIN");

                return (
                  <tr key={organizador.id}>
                    <td data-rotulo="Nome">{organizador.nome}</td>
                    <td data-rotulo="E-mail">{organizador.email}</td>
                    <td data-rotulo="CPF">
                      {organizador.cpf ? formatarCpf(organizador.cpf) : "Convite pendente"}
                    </td>
                    <td data-rotulo="Papel">
                      <span className={`${styles.tag} ${eAdmin ? styles.tagAdmin : ""}`}>
                        {eAdmin ? "Administrador" : "Organizador"}
                      </span>
                    </td>
                    <td data-rotulo="Ações" className={styles.colunaAcoes}>
                      {!eAdmin && (
                        <div className={styles.acoesLinha}>
                          <button
                            type="button"
                            className={styles.botaoIcone}
                            aria-label={`Promover ${organizador.nome} a administrador`}
                            onClick={() =>
                              setConfirmando({ id: organizador.id, tipo: "promover" })
                            }
                          >
                            <ShieldPlus size={16} strokeWidth={1.5} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                            aria-label={`Remover ${organizador.nome}`}
                            onClick={() =>
                              setConfirmando({ id: organizador.id, tipo: "remover" })
                            }
                          >
                            <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <Modal titulo="Adicionar organizador" onFechar={fecharModal}>
          <OrganizadorForm aoSalvar={aoSalvar} aoCancelar={fecharModal} />
        </Modal>
      )}

      {confirmando && (
        <ModalConfirmacao
          titulo={confirmando.tipo === "promover" ? "Promover a administrador" : "Remover organizador"}
          mensagem={
            confirmando.tipo === "promover"
              ? `${organizadorEmConfirmacao?.nome} passará a ter acesso total ao Narrativas.`
              : `${organizadorEmConfirmacao?.nome} perderá o acesso de organizador. Essa ação não pode ser desfeita.`
          }
          rotuloConfirmar={confirmando.tipo === "promover" ? "Promover" : "Remover"}
          perigo={confirmando.tipo !== "promover"}
          confirmando={processandoId === confirmando.id}
          onConfirmar={() =>
            confirmando.tipo === "promover"
              ? promoverAdmin(confirmando.id)
              : removerOrganizador(confirmando.id)
          }
          onCancelar={() => setConfirmando(null)}
        />
      )}
    </div>
  );
}
