"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import ProgramaPosGraduacaoForm from "./ProgramaPosGraduacaoForm";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import styles from "./ProgramasPosGraduacaoPainel.module.scss";

export default function ProgramasPosGraduacaoPainel({ programasIniciais, podeEditar = true }) {
  const router = useRouter();
  const { notificar } = useToast();

  const [programas, setProgramas] = useState(programasIniciais);
  const [programaEmEdicao, setProgramaEmEdicao] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);

  function abrirCriacao() {
    setProgramaEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(programa) {
    setProgramaEmEdicao(programa);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setProgramaEmEdicao(null);
  }

  function aoSalvar(programaSalvo) {
    setProgramas((atual) => {
      const jaExiste = atual.some((item) => item.id === programaSalvo.id);
      if (jaExiste) {
        return atual.map((item) => (item.id === programaSalvo.id ? programaSalvo : item));
      }
      return [...atual, programaSalvo];
    });
    fecharModal();
    router.refresh();
  }

  async function excluirPrograma(id) {
    setProcessandoId(id);

    try {
      await apiClient.delete(`/programas-pos-graduacao/${id}`);
      setProgramas((atual) => atual.filter((item) => item.id !== id));
      notificar("Programa de pós-graduação excluído com sucesso.");
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
          <h1 className={styles.titulo}>Programas de Pós-Graduação</h1>
          <p className={styles.descricao}>
            Programas afiliados ao GPDES/UnB exibidos no rodapé de todas as páginas públicas — logo
            e link são opcionais.
          </p>
        </div>
        {podeEditar && (
          <Botao type="button" onClick={abrirCriacao}>
            <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
            Novo programa
          </Botao>
        )}
      </div>

      {programas.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhum programa de pós-graduação cadastrado ainda.</p>
          <p className={styles.vazioApoio}>
            Crie o primeiro programa para exibi-lo no rodapé do site.
          </p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th className={styles.colunaLogo}>Logo</th>
                <th>Nome</th>
                <th className={styles.colunaAcoes}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {programas.map((programa) => (
                <tr key={programa.id}>
                  <td data-rotulo="Logo" className={styles.colunaLogo}>
                    {programa.imagem ? (
                      <img src={programa.imagem} alt="" className={styles.logo} />
                    ) : (
                      <span className={styles.semLogo}>Sem logo</span>
                    )}
                  </td>
                  <td data-rotulo="Nome">{programa.nome}</td>
                  <td data-rotulo="Ações" className={styles.colunaAcoes}>
                    {podeEditar && (
                      <div className={styles.acoesLinha}>
                        <button
                          type="button"
                          className={styles.botaoIcone}
                          aria-label={`Editar ${programa.nome}`}
                          onClick={() => abrirEdicao(programa)}
                        >
                          <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                          aria-label={`Excluir ${programa.nome}`}
                          onClick={() => setConfirmandoId(programa.id)}
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
          titulo={programaEmEdicao ? "Editar programa" : "Novo programa de pós-graduação"}
          onFechar={fecharModal}
        >
          <ProgramaPosGraduacaoForm
            programaInicial={programaEmEdicao}
            aoSalvar={aoSalvar}
            aoCancelar={fecharModal}
          />
        </Modal>
      )}

      {confirmandoId && (
        <ModalConfirmacao
          titulo="Excluir programa de pós-graduação"
          mensagem={`Tem certeza que deseja excluir "${programas.find((programa) => programa.id === confirmandoId)?.nome}"? Essa ação não pode ser desfeita.`}
          confirmando={processandoId === confirmandoId}
          onConfirmar={() => excluirPrograma(confirmandoId)}
          onCancelar={() => setConfirmandoId(null)}
        />
      )}
    </div>
  );
}
