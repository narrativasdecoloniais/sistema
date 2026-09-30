"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Trash2 } from "lucide-react";
import Botao from "@/components/forms/Botao";
import ModalConfirmacao from "./ModalConfirmacao";
import CampoTexto from "./CampoTexto";
import CabecalhoTabela, { LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { modalidadeSubmissaoSchema, extrairErros } from "@/lib/validacao";
import { paraData } from "@/lib/dataHoraIngenua";
import styles from "./SubmissoesRecebimentoPainel.module.scss";
import DetalheSubmissaoModal from "./DetalheSubmissaoModal";
import LinkEditarSubmissao from "./LinkEditarSubmissao";

function formatarData(valor) {
  return new Date(valor).toLocaleDateString("pt-BR", { dateStyle: "short" });
}

export default function SubmissoesRecebimentoPainel({ edicaoId, submissoesIniciais, modalidadesIniciais }) {
  const router = useRouter();
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
        <Botao type="button" onClick={() => router.push(`/admin/edicoes/${edicaoId}/submissoes/recebimento/nova`)}>
          Inserir submissão
        </Botao>
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

  const [busca, setBusca] = useState("");
  const [detalheId, setDetalheId] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [processandoId, setProcessandoId] = useState(null);

  const colunas = useMemo(
    () => [
      {
        chave: "titulo",
        rotulo: "Título",
        valor: (submissao) => submissao.titulo,
      },
      {
        chave: "modalidade",
        rotulo: "Modalidade",
        valor: (submissao) => submissao.modalidadeSubmissao.nome,
        filtro: "select",
        opcoes: modalidades.map((modalidade) => ({ valor: modalidade.id, rotulo: modalidade.nome })),
        corresponde: (submissao, modalidadeId) => submissao.modalidadeSubmissao.id === modalidadeId,
      },
      {
        chave: "area",
        rotulo: "Área",
        valor: (submissao) => submissao.areaSubmissao?.titulo || null,
        filtro: "select",
        // Prefixo da modalidade porque áreas de modalidades diferentes podem ter o mesmo título.
        opcoes: modalidades.flatMap((modalidade) =>
          (modalidade.areas || []).map((area) => ({
            valor: area.id,
            rotulo: modalidades.length > 1 ? `${modalidade.nome}: ${area.titulo}` : area.titulo,
          }))
        ),
        corresponde: (submissao, areaId) => submissao.areaSubmissao?.id === areaId,
      },
      {
        chave: "autorPrincipal",
        rotulo: "Autor principal",
        valor: (submissao) => submissao.autores.find((autor) => autor.principal)?.nome || null,
        texto: (submissao) => {
          const autor = submissao.autores.find((item) => item.principal);
          return autor ? `${autor.nome} ${autor.email}` : "";
        },
        exportar: (submissao) => {
          const autor = submissao.autores.find((item) => item.principal);
          return autor ? `${autor.nome} (${autor.email})` : "";
        },
      },
      {
        chave: "coautores",
        rotulo: "Coautores",
        valor: (submissao) => submissao.autores.filter((autor) => !autor.principal).length,
        classe: styles.colunaCoautores,
      },
      {
        chave: "enviadoEm",
        rotulo: "Enviado em",
        valor: (submissao) => new Date(submissao.createdAt).getTime(),
        texto: (submissao) => formatarData(submissao.createdAt),
        classe: styles.colunaData,
      },
    ],
    [modalidades]
  );

  // Busca livre continua existindo porque cobre também os coautores, que a
  // tabela só mostra como contagem.
  const submissoesBuscadas = useMemo(() => {
    const buscaNormalizada = busca.trim().toLowerCase();
    return submissoes.filter((submissao) => {
      if (!buscaNormalizada) return true;

      const alvoTitulo = submissao.titulo.toLowerCase();
      const alvoAutores = submissao.autores.map((autor) => `${autor.nome} ${autor.email}`.toLowerCase());
      return alvoTitulo.includes(buscaNormalizada) || alvoAutores.some((alvo) => alvo.includes(buscaNormalizada));
    });
  }, [submissoes, busca]);

  const tabela = useTabela(submissoesBuscadas, colunas);
  const submissoesFiltradas = tabela.linhasVisiveis;

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
        <CampoTexto
          id="buscaSubmissao"
          rotulo="Buscar por título ou autor"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Digite para buscar..."
        />
      </div>

      {submissoesBuscadas.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhuma submissão encontrada.</p>
          <p className={styles.vazioApoio}>
            {submissoes.length === 0
              ? "As submissões aparecem aqui conforme as pessoas enviam trabalhos pelo site público."
              : "Nenhuma submissão para a busca informada."}
          </p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <BotaoExportarTabela tabela={tabela} nomeArquivo="submissoes" nomeAba="Submissões" />
          <table className={styles.tabela}>
            <CabecalhoTabela tabela={tabela} idTabela="submissoes" classeAcoes={styles.colunaAcoes} />
            <tbody>
              {submissoesFiltradas.length === 0 && (
                <LinhaSemResultado tabela={tabela} colSpan={colunas.length + 1} />
              )}
              {submissoesFiltradas.map((submissao) => {
                const autorPrincipal = submissao.autores.find((autor) => autor.principal);
                const coautores = submissao.autores.filter((autor) => !autor.principal);

                return (
                  <tr key={submissao.id}>
                    <td data-rotulo="Título">
                      {submissao.titulo}
                    </td>
                    <td data-rotulo="Modalidade">{submissao.modalidadeSubmissao.nome}</td>
                    <td data-rotulo="Área">{submissao.areaSubmissao?.titulo || "—"}</td>
                    <td data-rotulo="Autor principal">
                      <div className={styles.colunaAutor}>
                        <span className={styles.autorNome}>{autorPrincipal?.nome}</span>
                        <span className={styles.autorEmail}>{autorPrincipal?.email}</span>
                      </div>
                    </td>
                    <td data-rotulo="Coautores" className={styles.colunaCoautores}>
                      {coautores.length}
                    </td>
                    <td data-rotulo="Enviado em" className={styles.colunaData}>
                      {formatarData(submissao.createdAt)}
                    </td>
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
                        <LinkEditarSubmissao edicaoId={edicaoId} submissao={submissao} className={styles.botaoIcone} />
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
        <DetalheSubmissaoModal
          edicaoId={edicaoId}
          submissao={submissaoEmDetalhe}
          modalidades={modalidades}
          onFechar={() => setDetalheId(null)}
          onAlterada={(atualizada) =>
            setSubmissoes((atual) => atual.map((item) => (item.id === atualizada.id ? atualizada : item)))
          }
        />
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
// Ordena/filtra pelo prazo salvo, não pelo que está sendo digitado — senão a
// linha pularia de posição no meio da edição.
const COLUNAS_CONFIGURACOES = [
  { chave: "modalidade", rotulo: "Modalidade", valor: (modalidade) => modalidade.nome },
  {
    chave: "prazoInicio",
    rotulo: "Início do prazo",
    valor: (modalidade) => paraData(modalidade.prazoInicio) || null,
    texto: (modalidade) => formatarPrazo(modalidade.prazoInicio),
  },
  {
    chave: "prazoFim",
    rotulo: "Fim do prazo",
    valor: (modalidade) => paraData(modalidade.prazoFim) || null,
    texto: (modalidade) => formatarPrazo(modalidade.prazoFim),
  },
];

function formatarPrazo(valor) {
  const data = paraData(valor);
  if (!data) return "";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

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
  const tabela = useTabela(modalidades, COLUNAS_CONFIGURACOES);

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
      <BotaoExportarTabela tabela={tabela} nomeArquivo="prazos-de-submissao" nomeAba="Prazos" />
      <table className={styles.tabela}>
        <CabecalhoTabela tabela={tabela} idTabela="prazos-submissao" classeAcoes={styles.colunaAcoes} />
        <tbody>
          {tabela.linhasVisiveis.length === 0 && (
            <LinhaSemResultado tabela={tabela} colSpan={COLUNAS_CONFIGURACOES.length + 1} />
          )}
          {tabela.linhasVisiveis.map((modalidade) => {
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
