"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Trash2 } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import CampoSelecao from "./CampoSelecao";
import CampoTexto from "./CampoTexto";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { modalidadeSubmissaoSchema, extrairErros } from "@/lib/validacao";
import { paraData } from "@/lib/dataHoraIngenua";
import styles from "./SubmissoesRecebimentoPainel.module.scss";

function formatarData(valor) {
  return new Date(valor).toLocaleDateString("pt-BR", { dateStyle: "short" });
}

export default function SubmissoesRecebimentoPainel({ edicaoId, submissoesIniciais, modalidadesIniciais }) {
  const [abaAtiva, setAbaAtiva] = useState("submissoes");
  const [submissoes, setSubmissoes] = useState(submissoesIniciais);
  const [modalidades, setModalidades] = useState(modalidadesIniciais);

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Recebimento de submissões</h1>
          <p className={styles.descricao}>
            Trabalhos enviados pelo site público nesta edição, organizados por modalidade e área.
          </p>
        </div>
      </div>

      <div className={styles.abas} role="tablist" aria-label="Seções de recebimento">
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === "submissoes"}
          tabIndex={abaAtiva === "submissoes" ? 0 : -1}
          className={`${styles.aba} ${abaAtiva === "submissoes" ? styles.abaAtiva : ""}`}
          onClick={() => setAbaAtiva("submissoes")}
        >
          Submissões
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === "configuracoes"}
          tabIndex={abaAtiva === "configuracoes" ? 0 : -1}
          className={`${styles.aba} ${abaAtiva === "configuracoes" ? styles.abaAtiva : ""}`}
          onClick={() => setAbaAtiva("configuracoes")}
        >
          Configurações
        </button>
      </div>

      {abaAtiva === "submissoes" ? (
        <AbaSubmissoes
          edicaoId={edicaoId}
          submissoes={submissoes}
          setSubmissoes={setSubmissoes}
          modalidades={modalidades}
        />
      ) : (
        <AbaConfiguracoes edicaoId={edicaoId} modalidades={modalidades} setModalidades={setModalidades} />
      )}
    </div>
  );
}

function AbaSubmissoes({ edicaoId, submissoes, setSubmissoes, modalidades }) {
  const router = useRouter();
  const { notificar } = useToast();

  const [filtroModalidadeId, setFiltroModalidadeId] = useState("");
  const [filtroAreaId, setFiltroAreaId] = useState("");
  const [busca, setBusca] = useState("");
  const [detalheId, setDetalheId] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [processandoId, setProcessandoId] = useState(null);

  const areasDaModalidade = useMemo(
    () => modalidades.find((modalidade) => modalidade.id === filtroModalidadeId)?.areas || [],
    [modalidades, filtroModalidadeId]
  );

  function aoMudarModalidade(valor) {
    setFiltroModalidadeId(valor);
    setFiltroAreaId("");
  }

  const submissoesFiltradas = useMemo(() => {
    const buscaNormalizada = busca.trim().toLowerCase();
    return submissoes.filter((submissao) => {
      if (filtroModalidadeId && submissao.modalidadeSubmissao.id !== filtroModalidadeId) return false;
      if (filtroAreaId && submissao.areaSubmissao?.id !== filtroAreaId) return false;
      if (!buscaNormalizada) return true;

      const alvoTitulo = submissao.titulo.toLowerCase();
      const alvoAutores = submissao.autores.map((autor) => `${autor.nome} ${autor.email}`.toLowerCase());
      return alvoTitulo.includes(buscaNormalizada) || alvoAutores.some((alvo) => alvo.includes(buscaNormalizada));
    });
  }, [submissoes, filtroModalidadeId, filtroAreaId, busca]);

  async function excluirSubmissao(id) {
    setProcessandoId(id);

    try {
      await apiClient.delete(`/edicoes/${edicaoId}/submissoes/${id}`);
      setSubmissoes((atual) => atual.filter((item) => item.id !== id));
      notificar("Submissão excluída com sucesso.");
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessandoId(null);
      setConfirmandoId(null);
    }
  }

  const submissaoEmConfirmacao = submissoes.find((item) => item.id === confirmandoId);
  const submissaoEmDetalhe = submissoes.find((item) => item.id === detalheId);

  return (
    <>
      <div className={styles.filtros}>
        <CampoSelecao
          id="filtroModalidade"
          rotulo="Modalidade"
          value={filtroModalidadeId}
          onChange={(evento) => aoMudarModalidade(evento.target.value)}
        >
          <option value="">Todas as modalidades</option>
          {modalidades.map((modalidade) => (
            <option key={modalidade.id} value={modalidade.id}>
              {modalidade.nome}
            </option>
          ))}
        </CampoSelecao>
        <CampoSelecao
          id="filtroArea"
          rotulo="Área"
          value={filtroAreaId}
          onChange={(evento) => setFiltroAreaId(evento.target.value)}
          disabled={!filtroModalidadeId || areasDaModalidade.length === 0}
        >
          <option value="">Todas as áreas</option>
          {areasDaModalidade.map((area) => (
            <option key={area.id} value={area.id}>
              {area.titulo}
            </option>
          ))}
        </CampoSelecao>
        <CampoTexto
          id="buscaSubmissao"
          rotulo="Buscar por título ou autor"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Digite para buscar..."
        />
      </div>

      {submissoesFiltradas.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhuma submissão encontrada.</p>
          <p className={styles.vazioApoio}>
            {submissoes.length === 0
              ? "As submissões aparecem aqui conforme as pessoas enviam trabalhos pelo site público."
              : "Nenhuma submissão para os filtros selecionados."}
          </p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Modalidade</th>
                <th>Área</th>
                <th>Autor principal</th>
                <th>Coautores</th>
                <th>Enviado em</th>
                <th className={styles.colunaAcoes}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {submissoesFiltradas.map((submissao) => {
                const autorPrincipal = submissao.autores.find((autor) => autor.principal);
                const coautores = submissao.autores.filter((autor) => !autor.principal);

                return (
                  <tr key={submissao.id}>
                    <td data-rotulo="Título">{submissao.titulo}</td>
                    <td data-rotulo="Modalidade">{submissao.modalidadeSubmissao.nome}</td>
                    <td data-rotulo="Área">{submissao.areaSubmissao?.titulo || "—"}</td>
                    <td data-rotulo="Autor principal">
                      <div className={styles.colunaAutor}>
                        <span className={styles.autorNome}>{autorPrincipal?.nome}</span>
                        <span className={styles.autorEmail}>{autorPrincipal?.email}</span>
                      </div>
                    </td>
                    <td data-rotulo="Coautores">{coautores.length}</td>
                    <td data-rotulo="Enviado em">{formatarData(submissao.createdAt)}</td>
                    <td data-rotulo="Ações" className={styles.colunaAcoes}>
                      <div className={styles.acoesLinha}>
                        <button
                          type="button"
                          className={styles.botaoIcone}
                          aria-label={`Ver detalhes de "${submissao.titulo}"`}
                          onClick={() => setDetalheId(submissao.id)}
                        >
                          <Eye size={16} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                          aria-label={`Excluir submissão "${submissao.titulo}"`}
                          onClick={() => setConfirmandoId(submissao.id)}
                        >
                          <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {submissaoEmDetalhe && (
        <Modal titulo={submissaoEmDetalhe.titulo} onFechar={() => setDetalheId(null)}>
          <div className={styles.detalhe}>
            <dl className={styles.metadados}>
              <div>
                <dt>Modalidade</dt>
                <dd>{submissaoEmDetalhe.modalidadeSubmissao.nome}</dd>
              </div>
              <div>
                <dt>Área</dt>
                <dd>{submissaoEmDetalhe.areaSubmissao?.titulo || "—"}</dd>
              </div>
              <div>
                <dt>Enviado em</dt>
                <dd>{formatarData(submissaoEmDetalhe.createdAt)}</dd>
              </div>
            </dl>

            <div className={styles.blocoDetalhe}>
              <span className={styles.rotuloBloco}>Autores</span>
              <ul className={styles.listaAutores}>
                {submissaoEmDetalhe.autores.map((autor) => (
                  <li key={autor.id}>
                    <span className={styles.autorNome}>{autor.nome}</span>
                    {autor.principal && <span className={styles.tag}>Principal</span>}
                    <span className={styles.autorEmail}>{autor.email}</span>
                    {autor.orcid && <span className={styles.autorOrcid}>ORCID: {autor.orcid}</span>}
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.blocoDetalhe}>
              <span className={styles.rotuloBloco}>Resumo</span>
              {/* Já sanitizado no backend na criação (sanitizarResumoSubmissao.js) — nunca re-sanitizado no cliente. */}
              <div
                className={styles.corpo}
                dangerouslySetInnerHTML={{ __html: submissaoEmDetalhe.resumo }}
              />
            </div>

            <div className={styles.blocoDetalhe}>
              <span className={styles.rotuloBloco}>Referência bibliográfica</span>
              <div
                className={styles.corpo}
                dangerouslySetInnerHTML={{ __html: submissaoEmDetalhe.referenciaBibliografica }}
              />
            </div>
          </div>
        </Modal>
      )}

      {confirmandoId && (
        <ModalConfirmacao
          titulo="Excluir submissão"
          mensagem={`Tem certeza que deseja excluir a submissão "${submissaoEmConfirmacao?.titulo}"? Essa ação não pode ser desfeita.`}
          confirmando={processandoId === confirmandoId}
          onConfirmar={() => excluirSubmissao(confirmandoId)}
          onCancelar={() => setConfirmandoId(null)}
        />
      )}
    </>
  );
}

// Atalho pra editar só o prazo de submissão das modalidades sem sair da tela
// de Recebimento. O PATCH de modalidades-submissao exige o payload completo
// (mesmo schema do formulário de criação/edição) — por isso reconstrói o
// objeto inteiro a partir da modalidade já carregada, preservando os `id`
// das áreas existentes pra sincronizarLista tratar como update em vez de
// criar áreas duplicadas.
function AbaConfiguracoes({ edicaoId, modalidades, setModalidades }) {
  const router = useRouter();
  const { notificar } = useToast();

  const [prazos, setPrazos] = useState(() =>
    Object.fromEntries(
      modalidades.map((modalidade) => [
        modalidade.id,
        { prazoInicio: paraData(modalidade.prazoInicio), prazoFim: paraData(modalidade.prazoFim) },
      ])
    )
  );
  const [erros, setErros] = useState({});
  const [salvandoId, setSalvandoId] = useState(null);

  function atualizarPrazo(modalidadeId, campo, valor) {
    setPrazos((atual) => ({
      ...atual,
      [modalidadeId]: { ...atual[modalidadeId], [campo]: valor },
    }));
  }

  function montarPayload(modalidade, prazo) {
    return {
      slug: modalidade.slug,
      nome: modalidade.nome,
      subtitulo: modalidade.subtitulo || "",
      prazoInicio: prazo.prazoInicio,
      prazoFim: prazo.prazoFim,
      resumoCurto: modalidade.resumoCurto,
      perguntaTitulo: modalidade.perguntaTitulo,
      descricao: modalidade.descricao || "",
      linkRotulo: modalidade.linkRotulo,
      rotuloItem: modalidade.rotuloItem,
      areas: (modalidade.areas || []).map((area) => ({
        id: area.id,
        slug: area.slug,
        titulo: area.titulo,
        descricao: area.descricao || "",
        atividadeIds: (area.atividades || []).map((atividade) => atividade.id),
      })),
    };
  }

  async function salvarPrazo(modalidade) {
    const prazo = prazos[modalidade.id];
    const resultado = modalidadeSubmissaoSchema.safeParse(montarPayload(modalidade, prazo));
    if (!resultado.success) {
      setErros((atual) => ({ ...atual, [modalidade.id]: extrairErros(resultado) }));
      return;
    }

    setErros((atual) => ({ ...atual, [modalidade.id]: {} }));
    setSalvandoId(modalidade.id);

    try {
      const resposta = await apiClient.patch(
        `/edicoes/${edicaoId}/modalidades-submissao/${modalidade.id}`,
        resultado.data
      );
      setModalidades((atual) => atual.map((item) => (item.id === modalidade.id ? resposta.modalidade : item)));
      notificar("Prazo atualizado com sucesso.");
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvandoId(null);
    }
  }

  if (modalidades.length === 0) {
    return (
      <div className={styles.vazio}>
        <p>Nenhuma modalidade de submissão cadastrada ainda.</p>
      </div>
    );
  }

  return (
    <div className={styles.tabelaWrapper}>
      <table className={styles.tabela}>
        <thead>
          <tr>
            <th>Modalidade</th>
            <th>Início do prazo</th>
            <th>Fim do prazo</th>
            <th className={styles.colunaAcoes}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {modalidades.map((modalidade) => {
            const prazo = prazos[modalidade.id] || { prazoInicio: "", prazoFim: "" };
            const errosLinha = erros[modalidade.id] || {};

            return (
              <tr key={modalidade.id}>
                <td data-rotulo="Modalidade">{modalidade.nome}</td>
                <td data-rotulo="Início do prazo">
                  <input
                    type="date"
                    className={styles.inputData}
                    aria-label={`Início do prazo de "${modalidade.nome}"`}
                    value={prazo.prazoInicio}
                    onChange={(evento) => atualizarPrazo(modalidade.id, "prazoInicio", evento.target.value)}
                  />
                  {errosLinha.prazoInicio && (
                    <p className={styles.mensagemErroLinha}>{errosLinha.prazoInicio}</p>
                  )}
                </td>
                <td data-rotulo="Fim do prazo">
                  <input
                    type="date"
                    className={styles.inputData}
                    aria-label={`Fim do prazo de "${modalidade.nome}"`}
                    value={prazo.prazoFim}
                    onChange={(evento) => atualizarPrazo(modalidade.id, "prazoFim", evento.target.value)}
                  />
                  {errosLinha.prazoFim && <p className={styles.mensagemErroLinha}>{errosLinha.prazoFim}</p>}
                </td>
                <td data-rotulo="Ações" className={styles.colunaAcoes}>
                  <Botao type="button" onClick={() => salvarPrazo(modalidade)} carregando={salvandoId === modalidade.id}>
                    Salvar
                  </Botao>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
