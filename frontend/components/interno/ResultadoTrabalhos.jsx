"use client";

import { useCallback, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import CampoTexto from "./CampoTexto";
import CampoArea from "./CampoArea";
import CabecalhoTabela, { LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { DECISOES_AVALIACAO, ROTULOS_DECISAO, STATUS_CORRECAO, ROTULOS_STATUS_CORRECAO } from "@/lib/avaliacoes";
import { conferirCorrecaoSchema, extrairErros } from "@/lib/validacao";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilosResultado from "./ResultadoSubmissoesPainel.module.scss";
import ConteudoRichText from "@/components/ConteudoRichText";
import LinkEditarSubmissao from "./LinkEditarSubmissao";

const SEM_DECISAO = "SEM_DECISAO";
const SEM_CORRECAO = "SEM_CORRECAO";

function situacaoEmail(trabalho, divulgado) {
  if (!divulgado) return "Não divulgado";
  if (trabalho.emailResultadoEnviadoEm) return "Enviado";
  if (trabalho.emailResultadoErro) return "Com erro";
  return "Na fila";
}

export default function AbaTrabalhosResultado({ edicaoId, trabalhos, modalidades, divulgado, recarregar }) {
  const [busca, setBusca] = useState("");
  const [detalheId, setDetalheId] = useState(null);

  const colunas = useMemo(
    () => [
      { chave: "titulo", rotulo: "Título", valor: (trabalho) => trabalho.titulo },
      {
        chave: "modalidade",
        rotulo: "Modalidade",
        valor: (trabalho) => trabalho.modalidadeSubmissao.nome,
        filtro: "select",
        opcoes: modalidades.map((modalidade) => ({ valor: modalidade.id, rotulo: modalidade.nome })),
        corresponde: (trabalho, modalidadeId) => trabalho.modalidadeSubmissao.id === modalidadeId,
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
        corresponde: (trabalho, areaId) => trabalho.areaSubmissao?.id === areaId,
      },
      {
        chave: "autorPrincipal",
        rotulo: "Autor principal",
        valor: (trabalho) => trabalho.autores.find((autor) => autor.principal)?.nome || null,
      },
      {
        chave: "decisaoFinal",
        rotulo: "Decisão final",
        valor: (trabalho) => (trabalho.decisaoFinal ? ROTULOS_DECISAO[trabalho.decisaoFinal] : null),
        filtro: "select",
        opcoes: [...DECISOES_AVALIACAO, { valor: SEM_DECISAO, rotulo: "Sem decisão" }],
        corresponde: (trabalho, valor) => (trabalho.decisaoFinal || SEM_DECISAO) === valor,
      },
      { chave: "observacao", rotulo: "Observação", valor: (trabalho) => trabalho.observacaoResultado || null },
      {
        chave: "correcao",
        rotulo: "Correção",
        valor: (trabalho) => (trabalho.statusCorrecao ? ROTULOS_STATUS_CORRECAO[trabalho.statusCorrecao] : null),
        filtro: "select",
        opcoes: [...STATUS_CORRECAO, { valor: SEM_CORRECAO, rotulo: "Não se aplica" }],
        corresponde: (trabalho, valor) => (trabalho.statusCorrecao || SEM_CORRECAO) === valor,
      },
      {
        chave: "email",
        rotulo: "E-mail",
        valor: (trabalho) => situacaoEmail(trabalho, divulgado),
        filtro: "select",
        opcoes: ["Não divulgado", "Na fila", "Enviado", "Com erro"].map((rotulo) => ({ valor: rotulo, rotulo })),
        corresponde: (trabalho, valor) => situacaoEmail(trabalho, divulgado) === valor,
      },
    ],
    [modalidades, divulgado]
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
  const trabalhoEmDetalhe = trabalhos.find((trabalho) => trabalho.id === detalheId);

  return (
    <>
      <div className={styles.filtros}>
        <CampoTexto
          id="buscaTrabalhoResultado"
          rotulo="Buscar por título ou autor"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Digite para buscar..."
        />
      </div>

      {trabalhosBuscados.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhum trabalho encontrado.</p>
          <p className={styles.vazioApoio}>
            {trabalhos.length === 0 ? "Nenhum trabalho foi submetido nesta edição." : "Nenhum trabalho para a busca informada."}
          </p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <BotaoExportarTabela tabela={tabela} nomeArquivo="resultado-das-submissoes" nomeAba="Resultado" />
          <table className={styles.tabela}>
            <CabecalhoTabela tabela={tabela} idTabela="resultado-trabalhos" classeAcoes={styles.colunaAcoes} />
            <tbody>
              {tabela.linhasVisiveis.length === 0 && (
                <LinhaSemResultado tabela={tabela} colSpan={colunas.length + 1} />
              )}
              {tabela.linhasVisiveis.map((trabalho) => {
                const autorPrincipal = trabalho.autores.find((autor) => autor.principal);
                const email = situacaoEmail(trabalho, divulgado);
                return (
                  <tr key={trabalho.id}>
                    <td data-rotulo="Título">{trabalho.titulo}</td>
                    <td data-rotulo="Modalidade">{trabalho.modalidadeSubmissao.nome}</td>
                    <td data-rotulo="Área">{trabalho.areaSubmissao?.titulo || "—"}</td>
                    <td data-rotulo="Autor principal">{autorPrincipal?.nome || "—"}</td>
                    <td data-rotulo="Decisão final">
                      {trabalho.decisaoFinal ? (
                        <span className={styles.decisaoFinal}>{ROTULOS_DECISAO[trabalho.decisaoFinal]}</span>
                      ) : (
                        <span className={styles.textoSuave}>Sem decisão</span>
                      )}
                    </td>
                    <td data-rotulo="Observação">
                      {trabalho.observacaoResultado || <span className={styles.textoSuave}>—</span>}
                    </td>
                    <td data-rotulo="Correção">
                      {trabalho.statusCorrecao === "ENVIADA" ? (
                        <span className={styles.tag}>Conferir correção</span>
                      ) : trabalho.statusCorrecao ? (
                        ROTULOS_STATUS_CORRECAO[trabalho.statusCorrecao]
                      ) : (
                        <span className={styles.textoSuave}>Não se aplica</span>
                      )}
                    </td>
                    <td data-rotulo="E-mail" title={trabalho.emailResultadoErro || undefined}>
                      {email === "Com erro" ? (
                        <span className={estilosResultado.textoErro}>Com erro</span>
                      ) : (
                        <span className={email === "Enviado" ? undefined : styles.textoSuave}>{email}</span>
                      )}
                    </td>
                    <td data-rotulo="Ações" className={styles.colunaAcoes}>
                      <div className={styles.acoesLinha}>
                        <button
                          type="button"
                          className={styles.botaoIcone}
                          aria-label={`Ver resultado de "${trabalho.titulo}"`}
                          onClick={() => setDetalheId(trabalho.id)}
                        >
                          <Eye size={16} strokeWidth={1.5} aria-hidden="true" />
                        </button>
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

      {trabalhoEmDetalhe && (
        <DetalheTrabalho
          edicaoId={edicaoId}
          trabalho={trabalhoEmDetalhe}
          divulgado={divulgado}
          recarregar={recarregar}
          onFechar={() => setDetalheId(null)}
        />
      )}
    </>
  );
}

function DetalheTrabalho({ edicaoId, trabalho, divulgado, recarregar, onFechar }) {
  const { notificar } = useToast();
  // "detalhe" | "aceitar" | "devolver" — um Modal por vez (dois abertos
  // disputariam o Esc e o foco).
  const [etapa, setEtapa] = useState("detalhe");
  const [observacao, setObservacao] = useState(trabalho.observacaoResultado || "");
  const [salvandoObservacao, setSalvandoObservacao] = useState(false);
  const [conferindo, setConferindo] = useState(false);

  const versaoAnterior = trabalho.versoes?.[0];
  const aguardandoConferencia = trabalho.statusCorrecao === "ENVIADA";

  async function salvarObservacao() {
    setSalvandoObservacao(true);
    try {
      await apiClient.patch(`/edicoes/${edicaoId}/resultado/trabalhos/${trabalho.id}/observacao`, { observacao });
      notificar("Observação salva.");
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvandoObservacao(false);
    }
  }

  // dados já validados por conferirCorrecaoSchema.
  async function conferir(dados) {
    setConferindo(true);
    try {
      const resposta = await apiClient.patch(`/edicoes/${edicaoId}/resultado/trabalhos/${trabalho.id}/correcao`, dados);
      notificar(resposta.mensagem);
      setEtapa("detalhe");
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setConferindo(false);
    }
  }

  const voltarAoDetalhe = useCallback(() => setEtapa("detalhe"), []);

  if (etapa === "aceitar") {
    return (
      <ModalConfirmacao
        titulo="Aceitar correção"
        mensagem={`A correção de "${trabalho.titulo}" será aceita e o trabalho entra na lista pública de aprovados.`}
        rotuloConfirmar="Aceitar"
        perigo={false}
        confirmando={conferindo}
        onConfirmar={() => conferir({ aceitar: true, motivo: "" })}
        onCancelar={voltarAoDetalhe}
      />
    );
  }

  if (etapa === "devolver") {
    return (
      <Modal titulo="Devolver correção" onFechar={voltarAoDetalhe}>
        <FormularioDevolucao conferindo={conferindo} onCancelar={voltarAoDetalhe} onDevolver={conferir} />
      </Modal>
    );
  }

  return (
    <Modal titulo={trabalho.titulo} onFechar={onFechar}>
      <div className={styles.detalhe}>
        <dl className={styles.metadados}>
          <div>
            <dt>Modalidade</dt>
            <dd>{trabalho.modalidadeSubmissao.nome}</dd>
          </div>
          <div>
            <dt>Área</dt>
            <dd>{trabalho.areaSubmissao?.titulo || "—"}</dd>
          </div>
          <div>
            <dt>Decisão final</dt>
            <dd>{trabalho.decisaoFinal ? ROTULOS_DECISAO[trabalho.decisaoFinal] : "Sem decisão"}</dd>
          </div>
          {trabalho.statusCorrecao && (
            <div>
              <dt>Correção</dt>
              <dd>{ROTULOS_STATUS_CORRECAO[trabalho.statusCorrecao]}</dd>
            </div>
          )}
        </dl>

        {trabalho.emailResultadoErro && !trabalho.emailResultadoEnviadoEm && (
          <p className={styles.aviso}>Falha no envio do e-mail: {trabalho.emailResultadoErro}</p>
        )}

        <section className={styles.blocoDetalhe} aria-labelledby="titulo-observacao-resultado">
          <h3 id="titulo-observacao-resultado" className={styles.rotuloBloco}>
            Observação para os autores
          </h3>
          {divulgado ? (
            <p className={estilosResultado.semMargem}>
              {trabalho.observacaoResultado || <span className={styles.textoSuave}>Sem observação.</span>}
            </p>
          ) : (
            <>
              <p className={styles.textoApoio}>
                Entra no e-mail pelo marcador {"{{observacao}}"}. Nas ressalvas, descreva o que o autor deve corrigir.
              </p>
              <CampoArea
                id="observacaoResultado"
                rotulo="Observação"
                linhas={4}
                value={observacao}
                onChange={(evento) => setObservacao(evento.target.value)}
              />
              <div>
                <Botao
                  type="button"
                  variante="secundario"
                  onClick={salvarObservacao}
                  carregando={salvandoObservacao}
                  disabled={observacao === (trabalho.observacaoResultado || "")}
                >
                  Salvar observação
                </Botao>
              </div>
            </>
          )}
        </section>

        {trabalho.motivoDevolucao && (
          <section className={styles.blocoDetalhe} aria-labelledby="titulo-motivo-devolucao">
            <h3 id="titulo-motivo-devolucao" className={styles.rotuloBloco}>
              Motivo da última devolução
            </h3>
            <p className={estilosResultado.semMargem}>{trabalho.motivoDevolucao}</p>
          </section>
        )}

        {aguardandoConferencia && (
          <div className={estilosResultado.acoesConferencia}>
            <Botao type="button" variante="secundario" onClick={() => setEtapa("devolver")}>
              Devolver
            </Botao>
            <Botao type="button" onClick={() => setEtapa("aceitar")}>
              Aceitar correção
            </Botao>
          </div>
        )}

        {versaoAnterior ? (
          <div className={estilosResultado.comparacao}>
            <VersaoTexto
              rotulo="Versão anterior"
              titulo={versaoAnterior.titulo}
              resumo={versaoAnterior.resumo}
              referencia={versaoAnterior.referenciaBibliografica}
            />
            <VersaoTexto
              rotulo="Versão atual"
              titulo={trabalho.titulo}
              resumo={trabalho.resumo}
              referencia={trabalho.referenciaBibliografica}
            />
          </div>
        ) : (
          <VersaoTexto titulo={null} resumo={trabalho.resumo} referencia={trabalho.referenciaBibliografica} />
        )}
      </div>
    </Modal>
  );
}

// Estado do texto fica aqui (e não no DetalheTrabalho) para que digitar não
// re-renderize o Modal pai — o Modal refoca o primeiro elemento sempre que
// recebe um onFechar novo.
function FormularioDevolucao({ conferindo, onCancelar, onDevolver }) {
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState("");

  function devolver() {
    const resultado = conferirCorrecaoSchema.safeParse({ aceitar: false, motivo });
    if (!resultado.success) {
      setErro(extrairErros(resultado).motivo);
      return;
    }
    onDevolver(resultado.data);
  }

  return (
    <div className={styles.formulario}>
      <p className={styles.textoApoio}>
        O autor principal recebe o motivo por e-mail e pode enviar nova versão até o prazo de correção.
      </p>
      <CampoArea
        id="motivoDevolucao"
        rotulo="O que ainda precisa ser corrigido"
        linhas={5}
        value={motivo}
        onChange={(evento) => setMotivo(evento.target.value)}
        erro={erro}
      />
      <div className={styles.acoesFormulario}>
        <Botao type="button" variante="secundario" onClick={onCancelar}>
          Cancelar
        </Botao>
        <Botao type="button" variante="perigo" carregando={conferindo} onClick={devolver}>
          Devolver ao autor
        </Botao>
      </div>
    </div>
  );
}

function VersaoTexto({ rotulo, titulo, resumo, referencia }) {
  return (
    <div className={styles.blocoDetalhe}>
      {rotulo && <h3 className={styles.rotuloBloco}>{rotulo}</h3>}
      {titulo && <p className={styles.nome}>{titulo}</p>}
      <span className={styles.rotuloBloco}>Resumo</span>
      <ConteudoRichText className={styles.corpo} html={resumo} tipo="resumo" />
      <span className={styles.rotuloBloco}>Referência bibliográfica</span>
      <ConteudoRichText className={styles.corpo} html={referencia || "<p>—</p>"} tipo="referencia" />
    </div>
  );
}
