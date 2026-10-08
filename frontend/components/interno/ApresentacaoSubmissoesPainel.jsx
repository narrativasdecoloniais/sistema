"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Link2, Unlink, Wand2, Eye, EyeOff, Send, Globe } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import CampoTexto from "./CampoTexto";
import CabecalhoTabela, { CelulaSelecao, LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela, { BotaoAcaoTabela } from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import useSelecaoLinhas from "./useSelecaoLinhas";
import LinkEditarSubmissao from "./LinkEditarSubmissao";
import ModalVincularAtividade from "./ModalVincularAtividade";
import AbaPorAtividade from "./ApresentacaoPorAtividade";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { DECISOES_AVALIACAO, ROTULOS_DECISAO } from "@/lib/avaliacoes";
// Tabelas, abas e modais são os mesmos das telas de Avaliação/Resultado.
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./ApresentacaoSubmissoesPainel.module.scss";

const INTERVALO_ATUALIZACAO_MS = 5000;
const SEM_ATIVIDADE = "SEM_ATIVIDADE";
const ROTULOS_AVISO = { AVISADO: "Avisado", NAO_AVISADO: "Não avisado", ERRO: "Com erro" };


export default function ApresentacaoSubmissoesPainel({ edicaoId, dadosIniciais, modalidades }) {
  const router = useRouter();
  const { notificar } = useToast();
  const [dados, setDados] = useState(dadosIniciais);
  const [abaAtiva, setAbaAtiva] = useState("trabalhos");
  // "publicar" | "ocultar" | "divulgar" | "ocultarPublico" | "avisos"
  const [confirmando, setConfirmando] = useState(null);
  const [processando, setProcessando] = useState(false);

  const recarregar = useCallback(async () => {
    setDados(await apiClient.get(`/edicoes/${edicaoId}/apresentacao`));
    router.refresh();
  }, [edicaoId, router]);

  const enviando = Boolean(dados?.estado.enviando);
  useEffect(() => {
    if (!enviando) return undefined;
    const temporizador = setInterval(() => recarregar().catch(() => {}), INTERVALO_ATUALIZACAO_MS);
    return () => clearInterval(temporizador);
  }, [enviando, recarregar]);

  if (!dados) {
    return (
      <div className={styles.vazio}>
        <p>Não foi possível carregar a apresentação dos trabalhos.</p>
        <p className={styles.vazioApoio}>Recarregue a página para tentar de novo.</p>
      </div>
    );
  }

  const { estado } = dados;
  // Duas etapas: liberar para os autores (Minhas submissões, e-mail) e,
  // depois, divulgar ao público (página de cada atividade, Anais).
  const publicada = Boolean(estado.publicadaEm);
  const publica = Boolean(estado.publicaEm);

  const REQUISICOES = {
    publicar: () => apiClient.patch(`/edicoes/${edicaoId}/apresentacao/publicacao`, { publicar: true }),
    ocultar: () => apiClient.patch(`/edicoes/${edicaoId}/apresentacao/publicacao`, { publicar: false }),
    divulgar: () => apiClient.patch(`/edicoes/${edicaoId}/apresentacao/publicacao-publica`, { publicar: true }),
    ocultarPublico: () => apiClient.patch(`/edicoes/${edicaoId}/apresentacao/publicacao-publica`, { publicar: false }),
    avisos: () => apiClient.post(`/edicoes/${edicaoId}/apresentacao/avisos`, {}),
  };

  async function executarConfirmacao() {
    setProcessando(true);
    try {
      const resposta = await REQUISICOES[confirmando]();
      notificar(resposta.mensagem);
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessando(false);
      setConfirmando(null);
    }
  }

  const MENSAGENS_CONFIRMACAO = {
    publicar: {
      titulo: "Liberar para os autores",
      mensagem:
        "Cada autor e coautor com conta passa a ver em Minhas submissões e no Início onde e quando vai apresentar. O público ainda não vê nada. Alterações feitas depois aparecem na hora.",
      rotulo: "Liberar",
    },
    ocultar: {
      titulo: "Ocultar dos autores",
      mensagem: publica
        ? "Os autores deixam de ver a apresentação em Minhas submissões, e os trabalhos também saem das páginas públicas das atividades."
        : "Os autores deixam de ver a apresentação em Minhas submissões até você liberar de novo.",
      rotulo: "Ocultar",
    },
    divulgar: {
      titulo: "Divulgar ao público",
      mensagem:
        "A lista de trabalhos de cada atividade, com título, nomes dos autores e resumo, passa a aparecer na página pública da atividade, para qualquer visitante do site.",
      rotulo: "Divulgar",
    },
    ocultarPublico: {
      titulo: "Ocultar do público",
      mensagem: "Os trabalhos saem das páginas públicas das atividades. Os autores continuam vendo a apresentação em Minhas submissões.",
      rotulo: "Ocultar",
    },
    avisos: {
      titulo: "Enviar aviso por e-mail",
      mensagem: `Cada autor e coautor de ${estado.avisosPendentes} ${estado.avisosPendentes === 1 ? "trabalho" : "trabalhos"} recebe um e-mail com a atividade, o dia, o horário e o local. Quem já foi avisado da atividade atual não recebe de novo.`,
      rotulo: "Enviar",
    },
  };

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Apresentação dos trabalhos</h1>
          <p className={styles.descricao}>
            Distribua os trabalhos aprovados nas atividades onde serão apresentados e defina a ordem de apresentação.
          </p>
        </div>
      </div>

      <section className={estilos.painelEstado} aria-label="Publicação e avisos">
        <div className={estilos.estadoTexto}>
          <p className={estilos.semMargem}>
            {publicada ? (
              <>
                <strong>Autores:</strong> liberada em {new Date(estado.publicadaEm).toLocaleDateString("pt-BR")} — cada
                um vê em Minhas submissões onde vai apresentar.
              </>
            ) : (
              <>
                <strong>Autores:</strong> oculta — só a organização vê.
              </>
            )}
          </p>
          <p className={estilos.semMargem}>
            {publica ? (
              <>
                <strong>Público:</strong> divulgada em {new Date(estado.publicaEm).toLocaleDateString("pt-BR")} — visível
                na página de cada atividade.
              </>
            ) : (
              <>
                <strong>Público:</strong> não divulgada.
              </>
            )}
          </p>
          <p className={styles.textoApoio} aria-live="polite">
            Avisos por e-mail: {estado.avisosPendentes} {estado.avisosPendentes === 1 ? "pendente" : "pendentes"}
            {estado.avisosComErro > 0 && ` (${estado.avisosComErro} com erro)`}
            {estado.enviando && " · enviando..."}
          </p>
          {!estado.resultadoDivulgado && (
            <p className={styles.aviso}>
              Liberar, divulgar e avisar os autores só fica disponível depois de{" "}
              <Link href={`/admin/edicoes/${edicaoId}/submissoes/resultado`} className={estilos.link}>
                divulgar o resultado
              </Link>
              . Você já pode ir distribuindo os trabalhos.
            </p>
          )}
        </div>
        <div className={estilos.estadoAcoes}>
          <Botao
            type="button"
            variante="secundario"
            onClick={() => setConfirmando(publicada ? "ocultar" : "publicar")}
            disabled={!estado.resultadoDivulgado && !publicada}
          >
            {publicada ? <EyeOff size={18} strokeWidth={1.5} aria-hidden="true" /> : <Eye size={18} strokeWidth={1.5} aria-hidden="true" />}
            {publicada ? "Ocultar dos autores" : "Liberar para os autores"}
          </Botao>
          <Botao
            type="button"
            variante="secundario"
            onClick={() => setConfirmando(publica ? "ocultarPublico" : "divulgar")}
            disabled={!publicada && !publica}
            title={!publicada ? "Libere para os autores antes de divulgar ao público" : undefined}
          >
            {publica ? <EyeOff size={18} strokeWidth={1.5} aria-hidden="true" /> : <Globe size={18} strokeWidth={1.5} aria-hidden="true" />}
            {publica ? "Ocultar do público" : "Divulgar ao público"}
          </Botao>
          <Botao
            type="button"
            onClick={() => setConfirmando("avisos")}
            disabled={!publicada || estado.avisosPendentes === 0 || estado.enviando}
            title={!publicada ? "Libere para os autores antes de avisá-los" : undefined}
          >
            <Send size={18} strokeWidth={1.5} aria-hidden="true" />
            Enviar aviso por e-mail ({estado.avisosPendentes})
          </Botao>
        </div>
      </section>

      <div className={styles.abas} role="tablist" aria-label="Seções da apresentação">
        {[
          { chave: "trabalhos", rotulo: "Trabalhos" },
          { chave: "atividades", rotulo: "Por atividade" },
        ].map((aba) => (
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

      {abaAtiva === "trabalhos" ? (
        <AbaTrabalhos edicaoId={edicaoId} dados={dados} modalidades={modalidades} recarregar={recarregar} />
      ) : (
        <AbaPorAtividade edicaoId={edicaoId} dados={dados} modalidades={modalidades} recarregar={recarregar} />
      )}

      {confirmando && (
        <ModalConfirmacao
          titulo={MENSAGENS_CONFIRMACAO[confirmando].titulo}
          mensagem={MENSAGENS_CONFIRMACAO[confirmando].mensagem}
          rotuloConfirmar={MENSAGENS_CONFIRMACAO[confirmando].rotulo}
          perigo={confirmando === "ocultar" || confirmando === "ocultarPublico"}
          confirmando={processando}
          onConfirmar={executarConfirmacao}
          onCancelar={() => setConfirmando(null)}
        />
      )}
    </div>
  );
}

function AbaTrabalhos({ edicaoId, dados, modalidades, recarregar }) {
  const { notificar } = useToast();
  const { trabalhos, atividades } = dados;
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState(null); // "vincular" | "desvincular" | { distribuir: previa }
  const [processando, setProcessando] = useState(false);

  const atividadesPorId = useMemo(() => new Map(atividades.map((atividade) => [atividade.id, atividade])), [atividades]);

  const colunas = useMemo(
    () => [
      { chave: "titulo", rotulo: "Título", valor: (trabalho) => trabalho.titulo },
      {
        chave: "modalidade",
        rotulo: "Modalidade",
        valor: (trabalho) => trabalho.modalidadeSubmissao.nome,
        filtro: "select",
        opcoes: modalidades.map((modalidade) => ({ valor: modalidade.id, rotulo: modalidade.nome })),
        corresponde: (trabalho, id) => trabalho.modalidadeSubmissao.id === id,
      },
      {
        chave: "area",
        rotulo: "Área",
        valor: (trabalho) => trabalho.areaSubmissao?.titulo || null,
        filtro: "select",
        opcoes: modalidades.flatMap((modalidade) =>
          (modalidade.areas || []).map((area) => ({
            valor: area.id,
            rotulo: modalidades.length > 1 ? `${modalidade.nome}: ${area.titulo}` : area.titulo,
          }))
        ),
        corresponde: (trabalho, id) => trabalho.areaSubmissao?.id === id,
      },
      {
        chave: "autorPrincipal",
        rotulo: "Autor principal",
        valor: (trabalho) => trabalho.autores.find((autor) => autor.principal)?.nome || null,
      },
      {
        chave: "decisao",
        rotulo: "Decisão",
        valor: (trabalho) => ROTULOS_DECISAO[trabalho.decisaoFinal],
        filtro: "select",
        opcoes: DECISOES_AVALIACAO.filter((decisao) => decisao.valor !== "REPROVADO"),
        corresponde: (trabalho, valor) => trabalho.decisaoFinal === valor,
      },
      {
        chave: "atividade",
        rotulo: "Atividade",
        valor: (trabalho) => atividadesPorId.get(trabalho.atividadeApresentacaoId)?.nome || null,
        filtro: "select",
        opcoes: [
          { valor: SEM_ATIVIDADE, rotulo: "Sem atividade" },
          ...atividades.map((atividade) => ({ valor: atividade.id, rotulo: atividade.nome })),
        ],
        corresponde: (trabalho, valor) => (trabalho.atividadeApresentacaoId || SEM_ATIVIDADE) === valor,
      },
      {
        chave: "ordem",
        rotulo: "Ordem",
        valor: (trabalho) => trabalho.ordemApresentacao,
        texto: (trabalho) => (trabalho.ordemApresentacao ? `${trabalho.ordemApresentacao}º` : ""),
        classe: styles.colunaCurta,
      },
      {
        chave: "aviso",
        rotulo: "Aviso por e-mail",
        valor: (trabalho) => (trabalho.statusAviso ? ROTULOS_AVISO[trabalho.statusAviso] : null),
        filtro: "select",
        opcoes: Object.entries(ROTULOS_AVISO).map(([valor, rotulo]) => ({ valor, rotulo })),
        corresponde: (trabalho, valor) => trabalho.statusAviso === valor,
      },
    ],
    [modalidades, atividades, atividadesPorId]
  );

  const trabalhosBuscados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return trabalhos;
    return trabalhos.filter(
      (trabalho) =>
        trabalho.titulo.toLowerCase().includes(termo) ||
        trabalho.autores.some((autor) => `${autor.nome} ${autor.email}`.toLowerCase().includes(termo))
    );
  }, [trabalhos, busca]);

  const tabela = useTabela(trabalhosBuscados, colunas);
  const selecao = useSelecaoLinhas(tabela);
  // Na ordem em que aparecem na tabela — é a ordem que entra na atividade.
  const idsSelecionados = tabela.linhasVisiveis.map((t) => t.id).filter((id) => selecao.estaSelecionado(id));
  const selecionadosVinculados = trabalhos.filter((t) => selecao.estaSelecionado(t.id) && t.atividadeApresentacaoId);

  async function executar(chamada) {
    setProcessando(true);
    try {
      const resposta = await chamada();
      if (resposta?.mensagem) notificar(resposta.mensagem);
      setModal(null);
      selecao.limpar();
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessando(false);
    }
  }

  async function previaDistribuicao() {
    try {
      const previa = await apiClient.post(`/edicoes/${edicaoId}/apresentacao/distribuir-por-area`, { simular: true });
      setModal({ distribuir: previa });
    } catch (erro) {
      notificar(erro.message, "erro");
    }
  }

  const previa = modal?.distribuir;

  return (
    <>
      <div className={estilos.barraAcoes}>
        <div className={estilos.busca}>
          <CampoTexto
            id="buscaApresentacao"
            rotulo="Buscar por título ou autor"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Digite para buscar..."
          />
        </div>
        <Botao type="button" variante="secundario" onClick={previaDistribuicao}>
          <Wand2 size={18} strokeWidth={1.5} aria-hidden="true" />
          Distribuir pela área
        </Botao>
      </div>

      {trabalhos.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhum trabalho aprovado nesta edição.</p>
          <p className={styles.vazioApoio}>
            Os trabalhos aparecem aqui quando recebem decisão final aprovada na tela de Avaliação.
          </p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <BotaoExportarTabela tabela={tabela} nomeArquivo="apresentacao-dos-trabalhos" nomeAba="Apresentação">
            {selecao.quantidade > 0 && (
              <BotaoAcaoTabela onClick={() => setModal("vincular")}>
                <Link2 size={16} strokeWidth={1.5} aria-hidden="true" />
                Vincular a atividade ({selecao.quantidade})
              </BotaoAcaoTabela>
            )}
            {selecionadosVinculados.length > 0 && (
              <BotaoAcaoTabela perigo onClick={() => setModal("desvincular")}>
                <Unlink size={16} strokeWidth={1.5} aria-hidden="true" />
                Remover da atividade ({selecionadosVinculados.length})
              </BotaoAcaoTabela>
            )}
          </BotaoExportarTabela>
          <table className={styles.tabela}>
            <CabecalhoTabela
              tabela={tabela}
              idTabela="apresentacao-trabalhos"
              classeAcoes={styles.colunaAcoes}
              selecao={selecao}
            />
            <tbody>
              {tabela.linhasVisiveis.length === 0 && (
                <LinhaSemResultado tabela={tabela} colSpan={colunas.length + 2} />
              )}
              {tabela.linhasVisiveis.map((trabalho) => {
                const atividade = atividadesPorId.get(trabalho.atividadeApresentacaoId);
                return (
                  <tr key={trabalho.id}>
                    <CelulaSelecao selecao={selecao} id={trabalho.id} rotulo={`Selecionar "${trabalho.titulo}"`} />
                    <td data-rotulo="Título">{trabalho.titulo}</td>
                    <td data-rotulo="Modalidade">{trabalho.modalidadeSubmissao.nome}</td>
                    <td data-rotulo="Área">{trabalho.areaSubmissao?.titulo || "—"}</td>
                    <td data-rotulo="Autor principal">
                      {trabalho.autores.find((autor) => autor.principal)?.nome || "—"}
                    </td>
                    <td data-rotulo="Decisão">{ROTULOS_DECISAO[trabalho.decisaoFinal]}</td>
                    <td data-rotulo="Atividade">
                      {atividade ? atividade.nome : <span className={styles.textoSuave}>Sem atividade</span>}
                    </td>
                    <td data-rotulo="Ordem" className={styles.colunaCurta}>
                      {trabalho.ordemApresentacao ? `${trabalho.ordemApresentacao}º` : "—"}
                    </td>
                    <td data-rotulo="Aviso por e-mail" title={trabalho.emailApresentacaoErro || undefined}>
                      {trabalho.statusAviso === "ERRO" ? (
                        <span className={estilos.textoErro}>Com erro</span>
                      ) : trabalho.statusAviso ? (
                        <span className={trabalho.statusAviso === "AVISADO" ? undefined : styles.textoSuave}>
                          {ROTULOS_AVISO[trabalho.statusAviso]}
                        </span>
                      ) : (
                        <span className={styles.textoSuave}>—</span>
                      )}
                    </td>
                    <td data-rotulo="Ações" className={styles.colunaAcoes}>
                      <div className={styles.acoesLinha}>
                        <LinkEditarSubmissao edicaoId={edicaoId} submissao={trabalho} className={styles.botaoIcone} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal === "vincular" && (
        <ModalVincularAtividade
          atividades={atividades}
          selecionados={trabalhos.filter((t) => selecao.estaSelecionado(t.id))}
          processando={processando}
          onFechar={() => setModal(null)}
          onConfirmar={(atividadeId) =>
            executar(() =>
              apiClient.post(`/edicoes/${edicaoId}/apresentacao/vincular`, {
                atividadeId,
                submissaoIds: idsSelecionados,
              })
            )
          }
        />
      )}

      {modal === "desvincular" && (
        <ModalConfirmacao
          titulo="Remover da atividade"
          mensagem={`${selecionadosVinculados.length} ${selecionadosVinculados.length === 1 ? "trabalho sai" : "trabalhos saem"} da atividade atual e a ordem dos demais é refeita.`}
          rotuloConfirmar="Remover"
          confirmando={processando}
          onConfirmar={() =>
            executar(() =>
              apiClient.post(`/edicoes/${edicaoId}/apresentacao/desvincular`, {
                submissaoIds: selecionadosVinculados.map((t) => t.id),
              })
            )
          }
          onCancelar={() => setModal(null)}
        />
      )}

      {previa && (
        <ModalDistribuir
          previa={previa}
          processando={processando}
          onFechar={() => setModal(null)}
          onConfirmar={() =>
            executar(async () => {
              const resultado = await apiClient.post(`/edicoes/${edicaoId}/apresentacao/distribuir-por-area`, {
                simular: false,
              });
              return {
                mensagem: `${resultado.vinculados} ${resultado.vinculados === 1 ? "trabalho vinculado" : "trabalhos vinculados"} pela área.`,
              };
            })
          }
        />
      )}
    </>
  );
}

// Estado da escolha fica aqui (e não no pai) para que marcar uma opção não
// recrie o onFechar do Modal — o Modal refoca o primeiro elemento quando isso
// acontece.
// Prévia de "Distribuir pela área": quantos entram em cada atividade de cada
// área (divisão equilibrada feita no backend) antes de confirmar.
function ModalDistribuir({ previa, processando, onFechar, onConfirmar }) {
  const { vinculados, semAtividade, porArea } = previa;
  return (
    <Modal titulo="Distribuir pela área" onFechar={onFechar}>
      <div className={styles.formulario}>
        <p className={estilos.semMargem}>
          {vinculados === 0
            ? "Nenhum trabalho sem atividade pode ser vinculado automaticamente."
            : `${vinculados} ${vinculados === 1 ? "trabalho será vinculado" : "trabalhos serão vinculados"}, divididos igualmente entre as atividades de cada área (quem já tem trabalhos recebe menos), sempre no fim da ordem.`}
          {semAtividade > 0 &&
            ` ${semAtividade} ${semAtividade === 1 ? "fica" : "ficam"} de fora porque a área (ou o trabalho) não tem atividade vinculada — vincule manualmente.`}
        </p>
        {porArea.length > 0 && (
          <div className={estilos.listaOpcoes}>
            {porArea.map((area) => (
              <section key={area.area} className={estilos.previaArea}>
                <h3 className={styles.rotuloBloco}>
                  {area.area} · {area.totalNovos} {area.totalNovos === 1 ? "trabalho" : "trabalhos"}
                </h3>
                <ul className={estilos.previaAtividades}>
                  {area.atividades.map((atividade) => (
                    <li key={atividade.id}>
                      <span>{atividade.nome}</span>
                      <span className={styles.textoSuave}>
                        +{atividade.novos} → {atividade.totalFinal}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
        <div className={styles.acoesFormulario}>
          <Botao type="button" variante="secundario" onClick={onFechar}>
            {vinculados > 0 ? "Cancelar" : "Fechar"}
          </Botao>
          {vinculados > 0 && (
            <Botao type="button" carregando={processando} onClick={onConfirmar}>
              Distribuir
            </Botao>
          )}
        </div>
      </div>
    </Modal>
  );
}
