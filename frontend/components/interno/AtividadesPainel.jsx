"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Copy } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import ModalDuplicarAtividade from "./ModalDuplicarAtividade";
import AtividadeForm from "./AtividadeForm";
import CabecalhoTabela, { LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import styles from "./AtividadesPainel.module.scss";

function rotuloVagas(atividade) {
  if (!atividade.exigeInscricao) return "Sem inscrição";
  if (atividade.semLimiteVagas) return "Ilimitado";
  return String(atividade.vagas);
}

// Atividade sem inscrição não tem contagem — null ordena por último e vira
// "—" na tela e célula vazia no Excel.
function contagemInscritos(atividade, campo) {
  if (!atividade.exigeInscricao) return null;
  return atividade.inscritos?.[campo] ?? 0;
}

const COLUNAS = [
  { chave: "nome", rotulo: "Nome", valor: (atividade) => atividade.nome },
  { chave: "tipo", rotulo: "Tipo", valor: (atividade) => atividade.tipoAtividade?.nome, filtro: "select" },
  {
    chave: "vagas",
    rotulo: "Vagas",
    // Sem inscrição fica por último; ilimitado acima de qualquer número.
    valor: (atividade) =>
      !atividade.exigeInscricao ? null : atividade.semLimiteVagas ? Infinity : atividade.vagas,
    texto: rotuloVagas,
  },
  {
    chave: "inscritos",
    rotulo: "Inscritos",
    valor: (atividade) => contagemInscritos(atividade, "confirmadas"),
  },
  {
    chave: "listaEspera",
    rotulo: "Lista de espera",
    valor: (atividade) => contagemInscritos(atividade, "listaEspera"),
  },
  { chave: "pessoas", rotulo: "Pessoas", valor: (atividade) => atividade.pessoas?.length || 0 },
  { chave: "ordem", rotulo: "Ordem", valor: (atividade) => atividade.ordem ?? null },
];

export default function AtividadesPainel({ edicaoId, atividadesIniciais, tiposAtividade, tiposParticipacao }) {
  const router = useRouter();
  const { notificar } = useToast();

  const [atividades, setAtividades] = useState(atividadesIniciais);
  const [atividadeEmEdicao, setAtividadeEmEdicao] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [duplicandoAtividade, setDuplicandoAtividade] = useState(null);
  const [duplicataCriada, setDuplicataCriada] = useState(null);
  const tabela = useTabela(atividades, COLUNAS);

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
        // A resposta de edição não traz `inscritos` (só a listagem traz) —
        // mantém a contagem já carregada, que não muda ao editar.
        return atual.map((item) =>
          item.id === atividadeSalva.id ? { inscritos: item.inscritos, ...atividadeSalva } : item
        );
      }
      return [...atual, { inscritos: { confirmadas: 0, listaEspera: 0 }, ...atividadeSalva }];
    });
    fecharModal();
    router.refresh();
  }

  function aoDuplicar(atividadeCriada) {
    setAtividades((atual) => [
      ...atual,
      { inscritos: { confirmadas: 0, listaEspera: 0 }, ...atividadeCriada },
    ]);
    setDuplicandoAtividade(null);
    setDuplicataCriada(atividadeCriada);
    router.refresh();
  }

  async function excluirAtividade(id) {
    setProcessandoId(id);

    try {
      await apiClient.delete(`/edicoes/${edicaoId}/atividades/${id}`);
      setAtividades((atual) => atual.filter((item) => item.id !== id));
      notificar("Atividade excluída com sucesso.");
      // Sem efeito quando chamado a partir da exclusão pela linha da tabela
      // (nenhum modal de edição aberto); fecha o formulário quando a
      // exclusão veio de dentro dele (AtividadeForm).
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
          <BotaoExportarTabela tabela={tabela} nomeArquivo="atividades" nomeAba="Atividades" />
          <table className={styles.tabela}>
            <CabecalhoTabela tabela={tabela} idTabela="atividades" classeAcoes={styles.colunaAcoes} />
            <tbody>
              {tabela.linhasVisiveis.length === 0 && (
                <LinhaSemResultado tabela={tabela} colSpan={COLUNAS.length + 1} />
              )}
              {tabela.linhasVisiveis.map((atividade) => (
                <tr key={atividade.id}>
                  <td data-rotulo="Nome">{atividade.nome}</td>
                  <td data-rotulo="Tipo">{atividade.tipoAtividade?.nome}</td>
                  <td data-rotulo="Vagas">{rotuloVagas(atividade)}</td>
                  <td data-rotulo="Inscritos">
                    {contagemInscritos(atividade, "confirmadas") ?? "—"}
                  </td>
                  <td data-rotulo="Lista de espera">
                    {contagemInscritos(atividade, "listaEspera") ?? "—"}
                  </td>
                  <td data-rotulo="Pessoas">{atividade.pessoas?.length || 0}</td>
                  <td data-rotulo="Ordem">{atividade.ordem ?? "—"}</td>
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
                        className={styles.botaoIcone}
                        aria-label={`Duplicar ${atividade.nome}`}
                        onClick={() => setDuplicandoAtividade(atividade)}
                      >
                        <Copy size={16} strokeWidth={1.5} aria-hidden="true" />
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
            aoExcluir={excluirAtividade}
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

      {duplicandoAtividade && (
        <ModalDuplicarAtividade
          edicaoId={edicaoId}
          atividade={duplicandoAtividade}
          onCancelar={() => setDuplicandoAtividade(null)}
          onDuplicar={aoDuplicar}
        />
      )}

      {duplicataCriada && (
        <Modal titulo="Atividade duplicada" onFechar={() => setDuplicataCriada(null)}>
          <div className={styles.corpoSucesso}>
            <p className={styles.mensagemSucesso}>
              &quot;{duplicataCriada.nome}&quot; foi duplicada com sucesso, incluindo{" "}
              {duplicataCriada.pessoas?.length || 0} pessoa(s) envolvida(s).
            </p>
            <div className={styles.acoesSucesso}>
              <Botao type="button" onClick={() => setDuplicataCriada(null)}>
                OK
              </Botao>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
