"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import TipoPontoInteresseForm from "./TipoPontoInteresseForm";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import styles from "./TiposPontoInteressePainel.module.scss";

export default function TiposPontoInteressePainel({ tiposIniciais, podeEditar = true }) {
  const router = useRouter();
  const { notificar } = useToast();

  const [tipos, setTipos] = useState(tiposIniciais);
  const [tipoEmEdicao, setTipoEmEdicao] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);

  function abrirCriacao() {
    setTipoEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(tipo) {
    setTipoEmEdicao(tipo);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setTipoEmEdicao(null);
  }

  function aoSalvar(tipoSalvo) {
    setTipos((atual) => {
      const jaExiste = atual.some((item) => item.id === tipoSalvo.id);
      if (jaExiste) {
        return atual.map((item) => (item.id === tipoSalvo.id ? tipoSalvo : item));
      }
      return [...atual, tipoSalvo].sort((a, b) => a.nome.localeCompare(b.nome));
    });
    fecharModal();
    router.refresh();
  }

  async function excluirTipo(id) {
    setProcessandoId(id);

    try {
      await apiClient.delete(`/tipos-ponto-interesse/${id}`);
      setTipos((atual) => atual.filter((item) => item.id !== id));
      notificar("Tipo de ponto de referência excluído com sucesso.");
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
          <h1 className={styles.titulo}>Tipos de ponto de referência</h1>
          <p className={styles.descricao}>
            Catálogo de tipos (ex.: local do evento, hospedagem, restaurante) usado para
            classificar os pontos exibidos no mapa da página pública de todas as edições.
          </p>
        </div>
        {podeEditar && (
          <Botao type="button" onClick={abrirCriacao}>
            <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
            Novo tipo
          </Botao>
        )}
      </div>

      {tipos.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhum tipo de ponto de referência cadastrado ainda.</p>
          <p className={styles.vazioApoio}>
            Crie o primeiro tipo para poder cadastrar pontos no mapa de Localização.
          </p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Nome</th>
                <th className={styles.colunaAcoes}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {tipos.map((tipo) => (
                <tr key={tipo.id}>
                  <td data-rotulo="Nome">
                    <span className={styles.nomeComCor}>
                      <span
                        className={styles.swatch}
                        style={{ backgroundColor: tipo.cor }}
                        aria-hidden="true"
                      />
                      {tipo.nome}
                    </span>
                  </td>
                  <td data-rotulo="Ações" className={styles.colunaAcoes}>
                    {podeEditar && (
                      <div className={styles.acoesLinha}>
                        <button
                          type="button"
                          className={styles.botaoIcone}
                          aria-label={`Editar ${tipo.nome}`}
                          onClick={() => abrirEdicao(tipo)}
                        >
                          <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                          aria-label={`Excluir ${tipo.nome}`}
                          onClick={() => setConfirmandoId(tipo.id)}
                        >
                          <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <Modal
          titulo={tipoEmEdicao ? "Editar tipo de ponto de referência" : "Novo tipo de ponto de referência"}
          onFechar={fecharModal}
        >
          <TipoPontoInteresseForm
            tipoPontoInteresseInicial={tipoEmEdicao}
            aoSalvar={aoSalvar}
            aoCancelar={fecharModal}
          />
        </Modal>
      )}

      {confirmandoId && (
        <ModalConfirmacao
          titulo="Excluir tipo de ponto de referência"
          mensagem={`Tem certeza que deseja excluir "${tipos.find((tipo) => tipo.id === confirmandoId)?.nome}"? Essa ação não pode ser desfeita.`}
          confirmando={processandoId === confirmandoId}
          onConfirmar={() => excluirTipo(confirmandoId)}
          onCancelar={() => setConfirmandoId(null)}
        />
      )}
    </div>
  );
}
