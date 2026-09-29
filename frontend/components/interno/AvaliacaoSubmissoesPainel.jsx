"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Trash2, UserPlus } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import CampoTexto from "./CampoTexto";
import CampoSelecao from "./CampoSelecao";
import CabecalhoTabela, { CelulaSelecao, LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela, { BotaoAcaoTabela } from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import useSelecaoLinhas from "./useSelecaoLinhas";
import AbaAvaliadores from "./AvaliadoresAvaliacao";
import AbaSugestoes from "./SugestoesTrocaArea";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { DECISOES_AVALIACAO, ROTULOS_DECISAO } from "@/lib/avaliacoes";
import { atribuirAvaliadorSchema, extrairErros } from "@/lib/validacao";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import ConteudoRichText from "@/components/ConteudoRichText";
import LinkEditarSubmissao from "./LinkEditarSubmissao";

const SEM_DECISAO = "SEM_DECISAO";

function formatarData(valor) {
  return new Date(valor).toLocaleDateString("pt-BR", { dateStyle: "short" });
}

function resumirDecisoes(atribuicoes) {
  const partes = DECISOES_AVALIACAO.map((decisao) => {
    const total = atribuicoes.filter((atribuicao) => atribuicao.decisao === decisao.valor).length;
    return total ? `${total} ${decisao.rotulo.toLowerCase()}` : null;
  }).filter(Boolean);
  return partes.join(" · ");
}

export default function AvaliacaoSubmissoesPainel({
  edicaoId,
  submissoesIniciais,
  avaliadoresIniciais,
  sugestoesIniciais,
  modalidades,
  resultadoDivulgadoEm,
}) {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState("submissoes");
  const [submissoes, setSubmissoes] = useState(submissoesIniciais);
  const [avaliadores, setAvaliadores] = useState(avaliadoresIniciais);
  const [sugestoes, setSugestoes] = useState(sugestoesIniciais);

  // Quase toda ação aqui mexe nas três listas ao mesmo tempo (ex.: aprovar
  // troca de área redistribui atribuições e muda contagens dos avaliadores),
  // então recarrega tudo em vez de tentar reconciliar localmente.
  const recarregar = useCallback(async () => {
    const base = `/edicoes/${edicaoId}/avaliacoes`;
    const [dadosSubmissoes, dadosAvaliadores, dadosSugestoes] = await Promise.all([
      apiClient.get(`${base}/submissoes`),
      apiClient.get(`${base}/avaliadores`),
      apiClient.get(`${base}/sugestoes`),
    ]);
    setSubmissoes(dadosSubmissoes?.submissoes || []);
    setAvaliadores(dadosAvaliadores?.avaliadores || []);
    setSugestoes(dadosSugestoes?.sugestoes || []);
    router.refresh();
  }, [edicaoId, router]);

  const sugestoesPendentes = sugestoes.filter((sugestao) => sugestao.status === "PENDENTE").length;

  const abas = [
    { chave: "submissoes", rotulo: "Submissões" },
    { chave: "avaliadores", rotulo: "Avaliadores" },
    { chave: "sugestoes", rotulo: sugestoesPendentes ? `Trocas de área (${sugestoesPendentes})` : "Trocas de área" },
  ];

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Avaliação de submissões</h1>
          <p className={styles.descricao}>
            Cadastre avaliadores por área, acompanhe as decisões de cada trabalho e registre a decisão final.
            A avaliação é cega: avaliadores não veem os autores.
          </p>
        </div>
      </div>

      {resultadoDivulgadoEm && (
        <p className={styles.aviso}>
          O resultado desta edição já foi divulgado em{" "}
          {new Date(resultadoDivulgadoEm).toLocaleDateString("pt-BR")}. As decisões e atribuições estão travadas —
          esta tela fica só para consulta.
        </p>
      )}

      <div className={styles.abas} role="tablist" aria-label="Seções da avaliação">
        {abas.map((aba) => (
          <button
            key={aba.chave}
            type="button"
            role="tab"
            aria-selected={abaAtiva === aba.chave}
            tabIndex={abaAtiva === aba.chave ? 0 : -1}
            className={`${styles.aba} ${abaAtiva === aba.chave ? styles.abaAtiva : ""}`}
            onClick={() => setAbaAtiva(aba.chave)}
          >
            {aba.rotulo}
          </button>
        ))}
      </div>

      {abaAtiva === "submissoes" && (
        <AbaSubmissoes
          edicaoId={edicaoId}
          submissoes={submissoes}
          avaliadores={avaliadores}
          modalidades={modalidades}
          recarregar={recarregar}
        />
      )}
      {abaAtiva === "avaliadores" && (
        <AbaAvaliadores
          edicaoId={edicaoId}
          avaliadores={avaliadores}
          modalidades={modalidades}
          recarregar={recarregar}
        />
      )}
      {abaAtiva === "sugestoes" && (
        <AbaSugestoes edicaoId={edicaoId} sugestoes={sugestoes} modalidades={modalidades} recarregar={recarregar} />
      )}
    </div>
  );
}

function AbaSubmissoes({ edicaoId, submissoes, avaliadores, modalidades, recarregar }) {
  const { notificar } = useToast();

  const [busca, setBusca] = useState("");
  const [detalheId, setDetalheId] = useState(null);
  const [atribuindoLote, setAtribuindoLote] = useState(false);

  const colunas = useMemo(
    () => [
      { chave: "titulo", rotulo: "Título", valor: (submissao) => submissao.titulo },
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
        chave: "avaliadores",
        rotulo: "Avaliadores",
        valor: (submissao) =>
          submissao.atribuicoesAvaliacao.map((atribuicao) => atribuicao.avaliadorEdicao.usuario.nome).join(", ") ||
          null,
      },
      {
        chave: "progresso",
        rotulo: "Avaliadas",
        valor: (submissao) => submissao.atribuicoesAvaliacao.filter((atribuicao) => atribuicao.decisao).length,
        texto: (submissao) => {
          const total = submissao.atribuicoesAvaliacao.length;
          const feitas = submissao.atribuicoesAvaliacao.filter((atribuicao) => atribuicao.decisao).length;
          return `${feitas}/${total}`;
        },
        classe: styles.colunaCurta,
      },
      {
        chave: "decisoes",
        rotulo: "Decisões dos avaliadores",
        valor: (submissao) => resumirDecisoes(submissao.atribuicoesAvaliacao) || null,
      },
      {
        chave: "trocaPendente",
        rotulo: "Troca de área pendente",
        valor: (submissao) => (submissao.sugestoesTrocaArea.length ? "Sim" : "Não"),
        filtro: "select",
        opcoes: [
          { valor: "SIM", rotulo: "Sim" },
          { valor: "NAO", rotulo: "Não" },
        ],
        corresponde: (submissao, valor) => (submissao.sugestoesTrocaArea.length > 0) === (valor === "SIM"),
      },
      {
        chave: "decisaoFinal",
        rotulo: "Decisão final",
        valor: (submissao) => (submissao.decisaoFinal ? ROTULOS_DECISAO[submissao.decisaoFinal] : null),
        filtro: "select",
        opcoes: [...DECISOES_AVALIACAO, { valor: SEM_DECISAO, rotulo: "Sem decisão" }],
        corresponde: (submissao, valor) => (submissao.decisaoFinal || SEM_DECISAO) === valor,
      },
    ],
    [modalidades]
  );

  // Busca livre cobre também os autores, que a tabela não mostra.
  const submissoesBuscadas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return submissoes;
    return submissoes.filter(
      (submissao) =>
        submissao.titulo.toLowerCase().includes(termo) ||
        submissao.autores.some((autor) => `${autor.nome} ${autor.email}`.toLowerCase().includes(termo))
    );
  }, [submissoes, busca]);

  const tabela = useTabela(submissoesBuscadas, colunas);
  const selecao = useSelecaoLinhas(tabela);
  const submissaoEmDetalhe = submissoes.find((submissao) => submissao.id === detalheId);

  return (
    <>
      <div className={styles.filtros}>
        <CampoTexto
          id="buscaSubmissaoAvaliacao"
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
          <BotaoExportarTabela tabela={tabela} nomeArquivo="avaliacao-de-submissoes" nomeAba="Avaliação">
            {selecao.quantidade > 0 && (
              <BotaoAcaoTabela onClick={() => setAtribuindoLote(true)}>
                <UserPlus size={16} strokeWidth={1.5} aria-hidden="true" />
                Atribuir avaliador a {selecao.quantidade} {selecao.quantidade === 1 ? "submissão" : "submissões"}
              </BotaoAcaoTabela>
            )}
          </BotaoExportarTabela>
          <table className={styles.tabela}>
            <CabecalhoTabela
              tabela={tabela}
              idTabela="avaliacao-submissoes"
              classeAcoes={styles.colunaAcoes}
              selecao={selecao}
            />
            <tbody>
              {tabela.linhasVisiveis.length === 0 && (
                <LinhaSemResultado tabela={tabela} colSpan={colunas.length + 2} />
              )}
              {tabela.linhasVisiveis.map((submissao) => {
                const atribuicoes = submissao.atribuicoesAvaliacao;
                const feitas = atribuicoes.filter((atribuicao) => atribuicao.decisao).length;
                return (
                  <tr key={submissao.id}>
                    <CelulaSelecao selecao={selecao} id={submissao.id} rotulo={`Selecionar "${submissao.titulo}"`} />
                    <td data-rotulo="Título">{submissao.titulo}</td>
                    <td data-rotulo="Modalidade">{submissao.modalidadeSubmissao.nome}</td>
                    <td data-rotulo="Área">{submissao.areaSubmissao?.titulo || "—"}</td>
                    <td data-rotulo="Avaliadores">
                      {atribuicoes.length
                        ? atribuicoes.map((atribuicao) => atribuicao.avaliadorEdicao.usuario.nome).join(", ")
                        : <span className={styles.textoSuave}>Nenhum</span>}
                    </td>
                    <td data-rotulo="Avaliadas" className={styles.colunaCurta}>
                      {feitas}/{atribuicoes.length}
                    </td>
                    <td data-rotulo="Decisões dos avaliadores">
                      {resumirDecisoes(atribuicoes) || <span className={styles.textoSuave}>—</span>}
                    </td>
                    <td data-rotulo="Troca de área pendente">
                      {submissao.sugestoesTrocaArea.length ? (
                        <span className={styles.tag}>Sim</span>
                      ) : (
                        <span className={styles.textoSuave}>Não</span>
                      )}
                    </td>
                    <td data-rotulo="Decisão final">
                      {submissao.decisaoFinal ? (
                        <span className={styles.decisaoFinal}>{ROTULOS_DECISAO[submissao.decisaoFinal]}</span>
                      ) : (
                        <span className={styles.textoSuave}>Sem decisão</span>
                      )}
                    </td>
                    <td data-rotulo="Ações" className={styles.colunaAcoes}>
                      <div className={styles.acoesLinha}>
                        <button
                          type="button"
                          className={styles.botaoIcone}
                          aria-label={`Gerenciar avaliação de "${submissao.titulo}"`}
                          onClick={() => setDetalheId(submissao.id)}
                        >
                          <Eye size={16} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                        <LinkEditarSubmissao edicaoId={edicaoId} submissao={submissao} className={styles.botaoIcone} />
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
        <DetalheSubmissao
          edicaoId={edicaoId}
          submissao={submissaoEmDetalhe}
          avaliadores={avaliadores}
          recarregar={recarregar}
          onFechar={() => setDetalheId(null)}
        />
      )}

      {atribuindoLote && (
        <ModalAtribuirLote
          edicaoId={edicaoId}
          submissaoIds={[...selecao.selecionados]}
          avaliadores={avaliadores}
          onFechar={() => setAtribuindoLote(false)}
          aoConcluir={async () => {
            setAtribuindoLote(false);
            selecao.limpar();
            try {
              await recarregar();
            } catch (erro) {
              notificar(erro.message, "erro");
            }
          }}
        />
      )}
    </>
  );
}

function mensagemResultadoAtribuicao({ criadas, ignoradasPorAutoria, jaAtribuidas }) {
  const partes = [`${criadas} ${criadas === 1 ? "atribuição criada" : "atribuições criadas"}`];
  if (jaAtribuidas) partes.push(`${jaAtribuidas} já ${jaAtribuidas === 1 ? "estava atribuída" : "estavam atribuídas"}`);
  if (ignoradasPorAutoria) {
    partes.push(`${ignoradasPorAutoria} ${ignoradasPorAutoria === 1 ? "ignorada" : "ignoradas"} por o avaliador ser autor`);
  }
  return `${partes.join(", ")}.`;
}

function ModalAtribuirLote({ edicaoId, submissaoIds, avaliadores, onFechar, aoConcluir }) {
  const { notificar } = useToast();
  const [avaliadorEdicaoId, setAvaliadorEdicaoId] = useState("");
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  async function atribuir(evento) {
    evento.preventDefault();
    const resultado = atribuirAvaliadorSchema.safeParse({ avaliadorEdicaoId, submissaoIds });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setSalvando(true);
    try {
      const resposta = await apiClient.post(`/edicoes/${edicaoId}/avaliacoes/atribuicoes`, resultado.data);
      notificar(mensagemResultadoAtribuicao(resposta));
      await aoConcluir();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Atribuir avaliador" onFechar={onFechar}>
      <form className={styles.formulario} onSubmit={atribuir}>
        <p className={styles.textoApoio}>
          {submissaoIds.length} {submissaoIds.length === 1 ? "submissão selecionada" : "submissões selecionadas"}.
          Trabalhos dos quais o avaliador é autor são ignorados.
        </p>
        {avaliadores.length === 0 ? (
          <p className={styles.textoApoio}>Cadastre avaliadores na aba “Avaliadores” primeiro.</p>
        ) : (
          <CampoSelecao
            id="avaliadorLote"
            rotulo="Avaliador"
            value={avaliadorEdicaoId}
            onChange={(evento) => setAvaliadorEdicaoId(evento.target.value)}
            erro={erros.avaliadorEdicaoId}
          >
            <option value="">Selecione...</option>
            {avaliadores.map((avaliador) => (
              <option key={avaliador.id} value={avaliador.id}>
                {avaliador.usuario.nome} ({avaliador.usuario.email})
              </option>
            ))}
          </CampoSelecao>
        )}
        <div className={styles.acoesFormulario}>
          <Botao type="button" variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" carregando={salvando} disabled={avaliadores.length === 0}>
            Atribuir
          </Botao>
        </div>
      </form>
    </Modal>
  );
}

function DetalheSubmissao({ edicaoId, submissao, avaliadores, recarregar, onFechar }) {
  const { notificar } = useToast();

  const [novoAvaliadorId, setNovoAvaliadorId] = useState("");
  const [adicionando, setAdicionando] = useState(false);
  const [decisaoFinal, setDecisaoFinal] = useState(submissao.decisaoFinal || "");
  const [salvandoDecisao, setSalvandoDecisao] = useState(false);
  const [removendoId, setRemovendoId] = useState(null);
  const [processandoRemocao, setProcessandoRemocao] = useState(false);

  const atribuidos = new Set(submissao.atribuicoesAvaliacao.map((atribuicao) => atribuicao.avaliadorEdicao.id));
  const disponiveis = avaliadores.filter((avaliador) => !atribuidos.has(avaliador.id));
  const atribuicaoEmRemocao = submissao.atribuicoesAvaliacao.find((atribuicao) => atribuicao.id === removendoId);

  async function adicionarAvaliador() {
    if (!novoAvaliadorId) return;
    setAdicionando(true);
    try {
      const resposta = await apiClient.post(`/edicoes/${edicaoId}/avaliacoes/atribuicoes`, {
        avaliadorEdicaoId: novoAvaliadorId,
        submissaoIds: [submissao.id],
      });
      if (resposta.ignoradasPorAutoria) {
        notificar("Este avaliador é autor do trabalho e não pode avaliá-lo.", "erro");
      } else {
        notificar("Avaliador atribuído com sucesso.");
      }
      setNovoAvaliadorId("");
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setAdicionando(false);
    }
  }

  async function removerAtribuicao() {
    setProcessandoRemocao(true);
    try {
      await apiClient.delete(`/edicoes/${edicaoId}/avaliacoes/atribuicoes/${removendoId}`);
      notificar("Atribuição removida com sucesso.");
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessandoRemocao(false);
      setRemovendoId(null);
    }
  }

  async function salvarDecisaoFinal() {
    setSalvandoDecisao(true);
    try {
      await apiClient.patch(`/edicoes/${edicaoId}/avaliacoes/submissoes/${submissao.id}/decisao-final`, {
        decisao: decisaoFinal || null,
      });
      notificar(decisaoFinal ? "Decisão final registrada." : "Decisão final removida.");
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvandoDecisao(false);
    }
  }

  // Um Modal por vez: dois abertos disputariam o Esc e o foco.
  if (atribuicaoEmRemocao) {
    return (
      <ModalConfirmacao
        titulo="Remover avaliador do trabalho"
        mensagem={
          atribuicaoEmRemocao.decisao
            ? `${atribuicaoEmRemocao.avaliadorEdicao.usuario.nome} já registrou a decisão "${ROTULOS_DECISAO[atribuicaoEmRemocao.decisao]}" — ela será descartada. Deseja remover?`
            : `Remover ${atribuicaoEmRemocao.avaliadorEdicao.usuario.nome} da avaliação deste trabalho?`
        }
        rotuloConfirmar="Remover"
        confirmando={processandoRemocao}
        onConfirmar={removerAtribuicao}
        onCancelar={() => setRemovendoId(null)}
      />
    );
  }

  const decisaoAlterada = (submissao.decisaoFinal || "") !== decisaoFinal;

  return (
    <Modal titulo={submissao.titulo} onFechar={onFechar}>
      <div className={styles.detalhe}>
        <dl className={styles.metadados}>
          <div>
            <dt>Modalidade</dt>
            <dd>{submissao.modalidadeSubmissao.nome}</dd>
          </div>
          <div>
            <dt>Área</dt>
            <dd>{submissao.areaSubmissao?.titulo || "—"}</dd>
          </div>
          <div>
            <dt>Enviado em</dt>
            <dd>{formatarData(submissao.createdAt)}</dd>
          </div>
        </dl>

        {submissao.sugestoesTrocaArea.length > 0 && (
          <p className={styles.aviso}>
            Há sugestão de troca para{" "}
            {submissao.sugestoesTrocaArea.map((sugestao) => sugestao.areaSugerida.titulo).join(", ")} aguardando
            resposta na aba “Trocas de área”.
          </p>
        )}

        <section className={styles.blocoDetalhe} aria-labelledby="titulo-avaliadores-trabalho">
          <h3 id="titulo-avaliadores-trabalho" className={styles.rotuloBloco}>
            Avaliadores
          </h3>
          {submissao.atribuicoesAvaliacao.length === 0 ? (
            <p className={styles.textoApoio}>Nenhum avaliador atribuído a este trabalho.</p>
          ) : (
            <ul className={styles.listaAtribuicoes}>
              {submissao.atribuicoesAvaliacao.map((atribuicao) => (
                <li key={atribuicao.id}>
                  <div className={styles.atribuicaoPessoa}>
                    <span className={styles.nome}>{atribuicao.avaliadorEdicao.usuario.nome}</span>
                    <span className={styles.textoSuave}>
                      {atribuicao.origem === "AREA" ? "Pela área" : "Atribuição manual"}
                    </span>
                  </div>
                  <span className={atribuicao.decisao ? styles.decisaoFinal : styles.textoSuave}>
                    {atribuicao.decisao ? ROTULOS_DECISAO[atribuicao.decisao] : "Aguardando"}
                  </span>
                  <button
                    type="button"
                    className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                    aria-label={`Remover ${atribuicao.avaliadorEdicao.usuario.nome} deste trabalho`}
                    onClick={() => setRemovendoId(atribuicao.id)}
                  >
                    <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {disponiveis.length > 0 && (
            <div className={styles.linhaAcao}>
              <CampoSelecao
                id="novoAvaliadorTrabalho"
                rotulo="Adicionar avaliador"
                value={novoAvaliadorId}
                onChange={(evento) => setNovoAvaliadorId(evento.target.value)}
              >
                <option value="">Selecione...</option>
                {disponiveis.map((avaliador) => (
                  <option key={avaliador.id} value={avaliador.id}>
                    {avaliador.usuario.nome}
                  </option>
                ))}
              </CampoSelecao>
              <Botao
                type="button"
                variante="secundario"
                onClick={adicionarAvaliador}
                carregando={adicionando}
                disabled={!novoAvaliadorId}
              >
                Adicionar
              </Botao>
            </div>
          )}
        </section>

        <section className={styles.blocoDetalhe} aria-labelledby="titulo-decisao-final">
          <h3 id="titulo-decisao-final" className={styles.rotuloBloco}>
            Decisão final
          </h3>
          <p className={styles.textoApoio}>
            Com a decisão final registrada, os avaliadores não podem mais alterar as próprias decisões.
          </p>
          <div className={styles.linhaAcao}>
            <CampoSelecao
              id="decisaoFinalTrabalho"
              rotulo="Decisão"
              value={decisaoFinal}
              onChange={(evento) => setDecisaoFinal(evento.target.value)}
            >
              <option value="">Sem decisão</option>
              {DECISOES_AVALIACAO.map((decisao) => (
                <option key={decisao.valor} value={decisao.valor}>
                  {decisao.rotulo}
                </option>
              ))}
            </CampoSelecao>
            <Botao type="button" onClick={salvarDecisaoFinal} carregando={salvandoDecisao} disabled={!decisaoAlterada}>
              Salvar decisão
            </Botao>
          </div>
        </section>

        <section className={styles.blocoDetalhe} aria-labelledby="titulo-autores-trabalho">
          <h3 id="titulo-autores-trabalho" className={styles.rotuloBloco}>
            Autores (não visíveis aos avaliadores)
          </h3>
          <ul className={styles.listaAutores}>
            {submissao.autores.map((autor) => (
              <li key={autor.id}>
                <span className={styles.nome}>{autor.nome}</span>
                {autor.principal && <span className={styles.tag}>Principal</span>}
                <span className={styles.textoSuave}>{autor.email}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.blocoDetalhe} aria-labelledby="titulo-resumo-trabalho">
          <h3 id="titulo-resumo-trabalho" className={styles.rotuloBloco}>
            Resumo
          </h3>
          <ConteudoRichText className={styles.corpo} html={submissao.resumo} tipo="resumo" />
        </section>

        <section className={styles.blocoDetalhe} aria-labelledby="titulo-referencia-trabalho">
          <h3 id="titulo-referencia-trabalho" className={styles.rotuloBloco}>
            Referência bibliográfica
          </h3>
          <ConteudoRichText className={styles.corpo} html={submissao.referenciaBibliografica} tipo="referencia" />
        </section>
      </div>
    </Modal>
  );
}
