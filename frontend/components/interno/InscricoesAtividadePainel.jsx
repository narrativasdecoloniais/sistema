"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowUpCircle, Clock, Mail } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import InscricaoAtividadeForm from "./InscricaoAtividadeForm";
import EnviarEmailModal from "./EnviarEmailModal";
import CampoTexto from "./CampoTexto";
import CartoesContadores from "./CartoesContadores";
import CabecalhoTabela, { CelulaSelecao, LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela, { BotaoAcaoTabela } from "./BotaoExportarTabela";
import useSelecaoLinhas from "./useSelecaoLinhas";
import useTabela, { normalizarTexto } from "./useTabela";
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

const OPCOES_STATUS = Object.entries(ROTULO_STATUS).map(([valor, rotulo]) => ({ valor, rotulo }));

// Busca geral por nome, e-mail, CPF ou documento estrangeiro. CPF e documento
// só entram quando o termo tem algum dígito, comparando sem pontuação
// ("123.456" acha "12345678900"); o documento já é guardado em maiúsculas,
// só com letras e dígitos.
function atendeBusca(usuario, busca) {
  const termo = normalizarTexto(busca.trim());
  if (!termo) return true;
  if (normalizarTexto(usuario.nome).includes(termo) || normalizarTexto(usuario.email).includes(termo)) {
    return true;
  }
  if (!/\d/.test(termo)) return false;

  const digitos = termo.replace(/\D/g, "");
  if (usuario.cpf && usuario.cpf.replace(/\D/g, "").includes(digitos)) return true;
  const documento = termo.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return Boolean(usuario.documentoEstrangeiro?.includes(documento));
}

// podeEnviarEmail: o envio em massa (/emails) é ADMIN-only, então o botão
// só aparece para admin, mesmo com a seção liberada para organizador.
export default function InscricoesAtividadePainel({
  edicaoId,
  edicaoNome,
  inscricoesIniciais,
  atividades,
  podeEnviarEmail = false,
}) {
  const router = useRouter();
  const { notificar } = useToast();

  const [inscricoes, setInscricoes] = useState(inscricoesIniciais);
  const [modalAberto, setModalAberto] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [busca, setBusca] = useState("");

  const colunas = useMemo(
    () => [
      {
        chave: "atividade",
        rotulo: "Atividade",
        valor: (inscricao) => inscricao.atividade.nome,
        filtro: "select",
        opcoes: atividades.map((atividade) => ({ valor: atividade.id, rotulo: atividade.nome })),
        corresponde: (inscricao, atividadeId) => inscricao.atividade.id === atividadeId,
      },
      {
        chave: "tipoAtividade",
        rotulo: "Tipo de atividade",
        valor: (inscricao) => inscricao.atividade.tipoAtividade?.nome || null,
        filtro: "select",
      },
      { chave: "nome", rotulo: "Nome", valor: (inscricao) => inscricao.usuario.nome },
      { chave: "email", rotulo: "E-mail", valor: (inscricao) => inscricao.usuario.email },
      {
        chave: "status",
        rotulo: "Status",
        valor: (inscricao) => inscricao.status,
        filtro: "select",
        opcoes: OPCOES_STATUS,
        exportar: (inscricao) => ROTULO_STATUS[inscricao.status],
      },
      {
        chave: "inscritoEm",
        rotulo: "Inscrito em",
        valor: (inscricao) => new Date(inscricao.createdAt).getTime(),
        texto: (inscricao) => formatarData(inscricao.createdAt),
      },
    ],
    [atividades]
  );

  // A busca filtra antes da tabela, então contadores, exportação e seleção em
  // lote acompanham o resultado.
  const inscricoesBuscadas = useMemo(
    () => inscricoes.filter((inscricao) => atendeBusca(inscricao.usuario, busca)),
    [inscricoes, busca]
  );
  const tabela = useTabela(inscricoesBuscadas, colunas);
  // "Limpar filtros" da linha sem resultado também limpa a busca.
  const tabelaComBusca = {
    ...tabela,
    limparFiltros: () => {
      tabela.limparFiltros();
      setBusca("");
    },
  };
  const selecao = useSelecaoLinhas(tabela);
  const [confirmandoLote, setConfirmandoLote] = useState(false);
  const [excluindoLote, setExcluindoLote] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const inscricoesFiltradas = tabela.linhasVisiveis;
  // Só sugere a atividade no modal de adicionar quando exatamente uma está filtrada.
  const atividadesFiltradas = tabela.filtros.atividade || [];
  const filtroAtividadeId = atividadesFiltradas.length === 1 ? atividadesFiltradas[0] : "";

  const contagem = useMemo(() => {
    const confirmadas = inscricoesFiltradas.filter((item) => item.status === "CONFIRMADA").length;
    return {
      total: inscricoesFiltradas.length,
      confirmadas,
      listaEspera: inscricoesFiltradas.length - confirmadas,
    };
  }, [inscricoesFiltradas]);

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

  async function excluirSelecionadas() {
    const ids = [...selecao.selecionados];
    setExcluindoLote(true);

    try {
      const resposta = await apiClient.post(
        `/edicoes/${edicaoId}/inscricoes-atividades/exclusao-em-lote`,
        { ids }
      );
      const removidas = new Set(ids);
      const promovidas = new Set(resposta.promovidas || []);
      setInscricoes((atual) =>
        atual
          .filter((item) => !removidas.has(item.id))
          .map((item) => (promovidas.has(item.id) ? { ...item, status: "CONFIRMADA" } : item))
      );
      selecao.limpar();
      notificar(
        promovidas.size > 0
          ? `${ids.length} inscrições excluídas. ${promovidas.size} ${promovidas.size === 1 ? "pessoa saiu" : "pessoas saíram"} da lista de espera.`
          : `${ids.length} ${ids.length === 1 ? "inscrição excluída" : "inscrições excluídas"} com sucesso.`
      );
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setExcluindoLote(false);
      setConfirmandoLote(false);
    }
  }

  // A seleção é por inscrição; a mesma pessoa pode estar em mais de uma
  // atividade selecionada, mas recebe o e-mail uma vez só.
  const destinatariosEmail = useMemo(() => {
    if (!enviandoEmail) return [];
    const porUsuario = new Map();
    for (const inscricao of inscricoes) {
      if (!selecao.selecionados.has(inscricao.id)) continue;
      const { id, nome, email } = inscricao.usuario;
      if (!porUsuario.has(id)) porUsuario.set(id, { id, nome, email });
    }
    return [...porUsuario.values()];
  }, [enviandoEmail, inscricoes, selecao.selecionados]);

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

      <CartoesContadores
        itens={[
          { rotulo: "Total", valor: contagem.total },
          { rotulo: "Confirmadas", valor: contagem.confirmadas, tom: "sucesso" },
          { rotulo: "Lista de espera", valor: contagem.listaEspera, tom: "alerta" },
        ]}
      />

      {inscricoes.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhuma inscrição em atividade encontrada.</p>
          <p className={styles.vazioApoio}>
            As inscrições aparecem aqui conforme as pessoas se inscrevem pelo site público, ou você
            pode adicionar uma manualmente.
          </p>
        </div>
      ) : (
        <>
          <div className={styles.busca}>
            <CampoTexto
              id="buscaInscricoesAtividade"
              rotulo="Buscar participante"
              type="search"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Nome, e-mail ou CPF"
            />
          </div>
          <div className={styles.tabelaWrapper}>
            <BotaoExportarTabela tabela={tabela} nomeArquivo="inscricoes-em-atividades" nomeAba="Inscrições em atividades">
              {podeEnviarEmail && selecao.quantidade > 0 && (
                <BotaoAcaoTabela onClick={() => setEnviandoEmail(true)}>
                  <Mail size={16} strokeWidth={1.5} aria-hidden="true" />
                  Enviar e-mail ({selecao.quantidade})
                </BotaoAcaoTabela>
              )}
              {selecao.quantidade > 0 && (
                <BotaoAcaoTabela perigo onClick={() => setConfirmandoLote(true)}>
                  <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                  Excluir {selecao.quantidade} {selecao.quantidade === 1 ? "selecionada" : "selecionadas"}
                </BotaoAcaoTabela>
              )}
            </BotaoExportarTabela>
            <table className={styles.tabela}>
              <CabecalhoTabela
                tabela={tabela}
                idTabela="inscricoes-atividade"
                classeAcoes={styles.colunaAcoes}
                selecao={selecao}
              />
              <tbody>
                {inscricoesFiltradas.length === 0 && (
                  <LinhaSemResultado tabela={tabelaComBusca} colSpan={colunas.length + 2} />
                )}
                {inscricoesFiltradas.map((inscricao) => (
                  <tr key={inscricao.id}>
                    <CelulaSelecao
                      selecao={selecao}
                      id={inscricao.id}
                      rotulo={`Selecionar inscrição de ${inscricao.usuario.nome} em ${inscricao.atividade.nome}`}
                    />
                    <td data-rotulo="Atividade">{inscricao.atividade.nome}</td>
                    <td data-rotulo="Tipo de atividade">
                      {inscricao.atividade.tipoAtividade?.nome || "—"}
                    </td>
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
        </>
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

      {enviandoEmail && (
        <EnviarEmailModal
          edicaoId={edicaoId}
          edicaoNome={edicaoNome}
          destinatarios={destinatariosEmail}
          onFechar={() => setEnviandoEmail(false)}
          onEnviado={selecao.limpar}
        />
      )}

      {confirmandoLote && (
        <ModalConfirmacao
          titulo="Excluir inscrições selecionadas"
          mensagem={`Tem certeza que deseja excluir ${selecao.quantidade} ${selecao.quantidade === 1 ? "inscrição" : "inscrições"}? Vagas liberadas em inscrições confirmadas promovem automaticamente a lista de espera. Essa ação não pode ser desfeita.`}
          rotuloConfirmar="Excluir"
          confirmando={excluindoLote}
          onConfirmar={excluirSelecionadas}
          onCancelar={() => setConfirmandoLote(false)}
        />
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
