"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, ShieldPlus, Settings2 } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import ParticipanteForm from "./ParticipanteForm";
import SeletorSecoesAdmin from "./SeletorSecoesAdmin";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { formatarCpf } from "@/lib/cpf";
import { temPapel } from "@/lib/permissoes";
import { ROTULOS_SECOES_ADMIN } from "@/lib/secoesAdmin";
import styles from "./ParticipantesPainel.module.scss";

function rotuloPermissoes(participante) {
  if (participante.acessoCompleto) return "Acesso completo";
  const total = participante.secoesPermitidas?.length || 0;
  if (total === 0) return "Sem seções liberadas";
  if (total === 1) return ROTULOS_SECOES_ADMIN[participante.secoesPermitidas[0]] || "1 seção";
  return `${total} seções`;
}

export default function ParticipantesPainel({ participantesIniciais, usuarioLogado }) {
  const router = useRouter();
  const { notificar } = useToast();
  const souAdmin = temPapel(usuarioLogado, "ADMIN");

  const [participantes, setParticipantes] = useState(participantesIniciais);
  const [modalAberto, setModalAberto] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const [editandoPermissoesId, setEditandoPermissoesId] = useState(null);
  const [permissoesEmEdicao, setPermissoesEmEdicao] = useState(null);
  const [salvandoPermissoes, setSalvandoPermissoes] = useState(false);

  function fecharModal() {
    setModalAberto(false);
  }

  function aoSalvar(participanteSalvo) {
    setParticipantes((atual) => [...atual, participanteSalvo]);
    fecharModal();
    router.refresh();
  }

  async function removerParticipante(id) {
    setProcessandoId(id);

    try {
      await apiClient.delete(`/organizadores/${id}`);
      setParticipantes((atual) => atual.filter((item) => item.id !== id));
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
      setParticipantes((atual) =>
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

  function abrirEdicaoPermissoes(participante) {
    setEditandoPermissoesId(participante.id);
    setPermissoesEmEdicao({
      acessoCompleto: participante.acessoCompleto,
      secoesPermitidas: participante.secoesPermitidas || [],
    });
  }

  function fecharEdicaoPermissoes() {
    setEditandoPermissoesId(null);
    setPermissoesEmEdicao(null);
  }

  async function salvarPermissoes() {
    setSalvandoPermissoes(true);

    try {
      const resposta = await apiClient.patch(
        `/organizadores/${editandoPermissoesId}/permissoes`,
        permissoesEmEdicao
      );
      setParticipantes((atual) =>
        atual.map((item) => (item.id === editandoPermissoesId ? resposta.organizador : item))
      );
      notificar(
        "Permissões atualizadas. Pode levar alguns minutos até valer para quem já está logado."
      );
      fecharEdicaoPermissoes();
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvandoPermissoes(false);
    }
  }

  const participanteEmConfirmacao = confirmando
    ? participantes.find((item) => item.id === confirmando.id)
    : null;

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Usuários e participantes</h1>
          <p className={styles.descricao}>
            Administradores têm acesso total ao Narrativas. Organizadores podem ser restritos a
            seções específicas do painel, ou promovidos a administrador.
          </p>
        </div>
        {souAdmin && (
          <Botao type="button" onClick={() => setModalAberto(true)}>
            <UserPlus size={18} strokeWidth={1.5} aria-hidden="true" />
            Adicionar organizador
          </Botao>
        )}
      </div>

      {participantes.length === 0 ? (
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
                <th>Permissões</th>
                <th className={styles.colunaAcoes}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {participantes.map((participante) => {
                const eAdmin = participante.papeis.includes("ADMIN");

                return (
                  <tr key={participante.id}>
                    <td data-rotulo="Nome">{participante.nome}</td>
                    <td data-rotulo="E-mail">{participante.email}</td>
                    <td data-rotulo="CPF">
                      {participante.cpf ? formatarCpf(participante.cpf) : "Convite pendente"}
                    </td>
                    <td data-rotulo="Papel">
                      <span className={`${styles.tag} ${eAdmin ? styles.tagAdmin : ""}`}>
                        {eAdmin ? "Administrador" : "Organizador"}
                      </span>
                    </td>
                    <td data-rotulo="Permissões">
                      {eAdmin ? "Acesso total" : rotuloPermissoes(participante)}
                    </td>
                    <td data-rotulo="Ações" className={styles.colunaAcoes}>
                      {!eAdmin && souAdmin && (
                        <div className={styles.acoesLinha}>
                          <button
                            type="button"
                            className={styles.botaoIcone}
                            aria-label={`Editar permissões de ${participante.nome}`}
                            onClick={() => abrirEdicaoPermissoes(participante)}
                          >
                            <Settings2 size={16} strokeWidth={1.5} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={styles.botaoIcone}
                            aria-label={`Promover ${participante.nome} a administrador`}
                            onClick={() =>
                              setConfirmando({ id: participante.id, tipo: "promover" })
                            }
                          >
                            <ShieldPlus size={16} strokeWidth={1.5} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                            aria-label={`Remover ${participante.nome}`}
                            onClick={() =>
                              setConfirmando({ id: participante.id, tipo: "remover" })
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
          <ParticipanteForm aoSalvar={aoSalvar} aoCancelar={fecharModal} />
        </Modal>
      )}

      {editandoPermissoesId && permissoesEmEdicao && (
        <Modal titulo="Editar permissões" onFechar={fecharEdicaoPermissoes}>
          <div className={styles.formPermissoes}>
            <SeletorSecoesAdmin
              acessoCompleto={permissoesEmEdicao.acessoCompleto}
              secoesSelecionadas={permissoesEmEdicao.secoesPermitidas}
              onAlterarAcessoCompleto={(valor) =>
                setPermissoesEmEdicao((atual) => ({ ...atual, acessoCompleto: valor }))
              }
              onAlterarSecoes={(valor) =>
                setPermissoesEmEdicao((atual) => ({ ...atual, secoesPermitidas: valor }))
              }
            />
            <div className={styles.acoes}>
              <Botao type="button" variante="secundario" onClick={fecharEdicaoPermissoes}>
                Cancelar
              </Botao>
              <Botao type="button" carregando={salvandoPermissoes} onClick={salvarPermissoes}>
                Salvar permissões
              </Botao>
            </div>
          </div>
        </Modal>
      )}

      {confirmando && (
        <ModalConfirmacao
          titulo={confirmando.tipo === "promover" ? "Promover a administrador" : "Remover organizador"}
          mensagem={
            confirmando.tipo === "promover"
              ? `${participanteEmConfirmacao?.nome} passará a ter acesso total ao Narrativas.`
              : `${participanteEmConfirmacao?.nome} perderá o acesso de organizador. Essa ação não pode ser desfeita.`
          }
          rotuloConfirmar={confirmando.tipo === "promover" ? "Promover" : "Remover"}
          perigo={confirmando.tipo !== "promover"}
          confirmando={processandoId === confirmando.id}
          onConfirmar={() =>
            confirmando.tipo === "promover"
              ? promoverAdmin(confirmando.id)
              : removerParticipante(confirmando.id)
          }
          onCancelar={() => setConfirmando(null)}
        />
      )}
    </div>
  );
}
