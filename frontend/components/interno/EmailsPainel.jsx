"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import Botao from "@/components/forms/Botao";
import ConteudoRichText from "@/components/ConteudoRichText";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import CampoTexto from "./CampoTexto";
import EditorEmail from "./EditorEmail";
import CabecalhoTabela, { LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { modeloEmailSchema, extrairErros } from "@/lib/validacao";
import { formatarDataHora, valoresExemplo } from "@/lib/emailsMassa";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";

const INTERVALO_ATUALIZACAO_MS = 4000;

// E-mails em massa (só ADMIN): modelos globais, reaproveitados em qualquer
// edição, e o histórico dos envios desta edição. O envio em si parte da aba
// Usuários de Participantes (EnviarEmailModal).
export default function EmailsPainel({ edicaoId, edicaoNome, usuarioLogado, modelosIniciais, enviosIniciais, usoInicial }) {
  const [abaAtiva, setAbaAtiva] = useState("modelos");
  const [envios, setEnvios] = useState(enviosIniciais);
  const [uso, setUso] = useState(usoInicial);

  const recarregarEnvios = useCallback(async () => {
    const [dadosEnvios, dadosUso] = await Promise.all([
      apiClient.get(`/emails/envios?edicaoId=${encodeURIComponent(edicaoId)}`),
      apiClient.get("/emails/uso-mensal"),
    ]);
    setEnvios(dadosEnvios?.envios || []);
    setUso(dadosUso);
  }, [edicaoId]);

  // Enquanto algum envio está em andamento, as contagens mudam sozinhas.
  const algumEmAndamento = envios.some((envio) => envio.emAndamento);
  useEffect(() => {
    if (!algumEmAndamento) return undefined;
    const intervalo = setInterval(() => recarregarEnvios().catch(() => {}), INTERVALO_ATUALIZACAO_MS);
    return () => clearInterval(intervalo);
  }, [algumEmAndamento, recarregarEnvios]);

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>E-mails</h1>
          <p className={styles.descricao}>
            Modelos de e-mail reaproveitáveis em qualquer edição e o histórico dos envios desta edição. Para enviar,
            selecione as pessoas na aba Usuários de{" "}
            <Link href={`/admin/edicoes/${edicaoId}/participantes`}>Usuários e Participantes</Link>.
          </p>
          {uso && (
            <p className={uso.enviadosNoMes >= uso.limite * 0.8 ? styles.aviso : styles.textoApoio}>
              Este mês: {uso.enviadosNoMes} e-mails em massa enviados, de {uso.limite} do plano do Resend — os
              automáticos (inscrições, convites, resultado) também contam nesse limite.
            </p>
          )}
        </div>
      </div>

      <div className={styles.abas} role="tablist" aria-label="Seções de e-mails">
        {[
          ["modelos", "Modelos"],
          ["envios", "Envios"],
        ].map(([chave, rotulo]) => (
          <button
            key={chave}
            type="button"
            role="tab"
            aria-selected={abaAtiva === chave}
            tabIndex={abaAtiva === chave ? 0 : -1}
            className={`${styles.aba} ${abaAtiva === chave ? styles.abaAtiva : ""}`}
            onClick={() => setAbaAtiva(chave)}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {abaAtiva === "modelos" ? (
        <AbaModelos modelosIniciais={modelosIniciais} edicaoId={edicaoId} edicaoNome={edicaoNome} usuarioLogado={usuarioLogado} />
      ) : (
        <AbaEnvios envios={envios} recarregar={recarregarEnvios} />
      )}
    </div>
  );
}

const COLUNAS_MODELOS = [
  { chave: "nome", rotulo: "Nome", valor: (modelo) => modelo.nome },
  { chave: "assunto", rotulo: "Assunto", valor: (modelo) => modelo.assunto },
  {
    chave: "updatedAt",
    rotulo: "Atualizado em",
    valor: (modelo) => new Date(modelo.updatedAt).getTime(),
    texto: (modelo) => formatarDataHora(modelo.updatedAt),
    exportar: (modelo) => formatarDataHora(modelo.updatedAt),
  },
];

function AbaModelos({ modelosIniciais, edicaoId, edicaoNome, usuarioLogado }) {
  const { notificar } = useToast();
  const [modelos, setModelos] = useState(modelosIniciais);
  // null = fechado; {} = novo; modelo = edição.
  const [editando, setEditando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [processando, setProcessando] = useState(false);
  const tabela = useTabela(modelos, COLUNAS_MODELOS);

  function aoSalvar(modelo) {
    setModelos((atuais) =>
      [...atuais.filter((item) => item.id !== modelo.id), modelo].sort((a, b) => a.nome.localeCompare(b.nome))
    );
    setEditando(null);
  }

  async function excluir() {
    setProcessando(true);
    try {
      await apiClient.delete(`/emails/modelos/${excluindo.id}`);
      setModelos((atuais) => atuais.filter((item) => item.id !== excluindo.id));
      notificar(`Modelo "${excluindo.nome}" excluído.`);
      setExcluindo(null);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessando(false);
    }
  }

  return (
    <>
      <div className={styles.barraAcoes}>
        <p className={styles.textoApoio}>Modelos valem para todas as edições.</p>
        <Botao type="button" onClick={() => setEditando({})}>
          <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
          Novo modelo
        </Botao>
      </div>

      {modelos.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhum modelo de e-mail ainda.</p>
          <p className={styles.vazioApoio}>
            Crie um modelo para reaproveitar o texto em envios futuros — ou escreva direto na hora de enviar.
          </p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <BotaoExportarTabela tabela={tabela} nomeArquivo="modelos-de-email" nomeAba="Modelos" />
          <table className={styles.tabela}>
            <CabecalhoTabela tabela={tabela} idTabela="modelos-email" classeAcoes={styles.colunaAcoes} />
            <tbody>
              {tabela.linhasVisiveis.length === 0 && (
                <LinhaSemResultado tabela={tabela} colSpan={COLUNAS_MODELOS.length + 1} />
              )}
              {tabela.linhasVisiveis.map((modelo) => (
                <tr key={modelo.id}>
                  <td data-rotulo="Nome">{modelo.nome}</td>
                  <td data-rotulo="Assunto">{modelo.assunto}</td>
                  <td data-rotulo="Atualizado em">{formatarDataHora(modelo.updatedAt)}</td>
                  <td data-rotulo="Ações" className={styles.colunaAcoes}>
                    <div className={styles.acoesLinha}>
                      <button
                        type="button"
                        className={styles.botaoIcone}
                        aria-label={`Editar o modelo ${modelo.nome}`}
                        title="Editar"
                        onClick={() => setEditando(modelo)}
                      >
                        <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                        aria-label={`Excluir o modelo ${modelo.nome}`}
                        title="Excluir"
                        onClick={() => setExcluindo(modelo)}
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

      {editando && (
        <ModeloEmailModal
          modelo={editando}
          edicaoId={edicaoId}
          exemplo={valoresExemplo(usuarioLogado, edicaoNome)}
          onFechar={() => setEditando(null)}
          onSalvo={aoSalvar}
        />
      )}

      {excluindo && (
        <ModalConfirmacao
          titulo="Excluir modelo"
          mensagem={`O modelo "${excluindo.nome}" deixa de aparecer para novos envios. Os envios já feitos com ele continuam no histórico.`}
          rotuloConfirmar="Excluir"
          confirmando={processando}
          onConfirmar={excluir}
          onCancelar={() => setExcluindo(null)}
        />
      )}
    </>
  );
}

function ModeloEmailModal({ modelo, edicaoId, exemplo, onFechar, onSalvo }) {
  const { notificar } = useToast();
  const [nome, setNome] = useState(modelo.nome || "");
  const [assunto, setAssunto] = useState(modelo.assunto || "");
  const [corpo, setCorpo] = useState(modelo.corpo || "");
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);

  function validar() {
    const resultado = modeloEmailSchema.safeParse({ nome, assunto, corpo });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return null;
    }
    setErros({});
    return resultado.data;
  }

  async function salvar(evento) {
    evento.preventDefault();
    const dados = validar();
    if (!dados) return;
    setSalvando(true);
    try {
      const resposta = modelo.id
        ? await apiClient.patch(`/emails/modelos/${modelo.id}`, dados)
        : await apiClient.post("/emails/modelos", dados);
      notificar(`Modelo "${resposta.modelo.nome}" salvo.`);
      onSalvo(resposta.modelo);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function enviarTeste() {
    const dados = validar();
    if (!dados) return;
    setTestando(true);
    try {
      const resposta = await apiClient.post("/emails/teste", { assunto: dados.assunto, corpo: dados.corpo, edicaoId });
      notificar(resposta.mensagem);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setTestando(false);
    }
  }

  return (
    <Modal titulo={modelo.id ? "Editar modelo" : "Novo modelo"} onFechar={onFechar}>
      <form onSubmit={salvar} className={styles.formulario}>
        <CampoTexto
          id="modelo-email-nome"
          rotulo="Nome do modelo (só para a organização)"
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
          erro={erros.nome}
        />
        <EditorEmail
          idBase="modelo-email"
          assunto={assunto}
          corpo={corpo}
          onAssunto={setAssunto}
          onCorpo={setCorpo}
          erros={erros}
          exemplo={exemplo}
        />
        <div className={styles.acoesFormulario}>
          <Botao type="button" variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao type="button" variante="secundario" onClick={enviarTeste} carregando={testando}>
            Enviar teste para mim
          </Botao>
          <Botao type="submit" carregando={salvando}>
            Salvar modelo
          </Botao>
        </div>
      </form>
    </Modal>
  );
}

function situacaoEnvio(envio) {
  if (envio.emAndamento) return "EM_ANDAMENTO";
  if (envio.pendentes === 0 && envio.falhas === 0) return "CONCLUIDO";
  if (envio.falhas > 0) return "COM_FALHAS";
  return "PAUSADO";
}

const ROTULOS_SITUACAO_ENVIO = {
  EM_ANDAMENTO: "Enviando",
  CONCLUIDO: "Concluído",
  COM_FALHAS: "Com falhas",
  PAUSADO: "Pausado",
};

const COLUNAS_ENVIOS = [
  {
    chave: "createdAt",
    rotulo: "Data",
    valor: (envio) => new Date(envio.createdAt).getTime(),
    texto: (envio) => formatarDataHora(envio.createdAt),
    exportar: (envio) => formatarDataHora(envio.createdAt),
  },
  { chave: "assunto", rotulo: "Assunto", valor: (envio) => envio.assunto },
  { chave: "modelo", rotulo: "Modelo", valor: (envio) => envio.modelo?.nome || null },
  { chave: "criadoPor", rotulo: "Enviado por", valor: (envio) => envio.criadoPor?.nome || null },
  { chave: "total", rotulo: "Destinatários", valor: (envio) => envio.total },
  { chave: "enviados", rotulo: "Enviados", valor: (envio) => envio.enviados },
  { chave: "falhas", rotulo: "Falhas", valor: (envio) => envio.falhas },
  {
    chave: "situacao",
    rotulo: "Situação",
    valor: situacaoEnvio,
    filtro: "select",
    opcoes: Object.entries(ROTULOS_SITUACAO_ENVIO).map(([valor, rotulo]) => ({ valor, rotulo })),
    exportar: (envio) => ROTULOS_SITUACAO_ENVIO[situacaoEnvio(envio)],
  },
];

function AbaEnvios({ envios, recarregar }) {
  const [detalheId, setDetalheId] = useState(null);
  const tabela = useTabela(envios, COLUNAS_ENVIOS);

  if (envios.length === 0) {
    return (
      <div className={styles.vazio}>
        <p>Nenhum e-mail enviado nesta edição ainda.</p>
        <p className={styles.vazioApoio}>
          Selecione as pessoas na aba Usuários de Usuários e Participantes e use &quot;Enviar e-mail&quot;.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.tabelaWrapper}>
        <BotaoExportarTabela tabela={tabela} nomeArquivo="envios-de-email" nomeAba="Envios" />
        <table className={styles.tabela}>
          <CabecalhoTabela tabela={tabela} idTabela="envios-email" classeAcoes={styles.colunaAcoes} />
          <tbody>
            {tabela.linhasVisiveis.length === 0 && (
              <LinhaSemResultado tabela={tabela} colSpan={COLUNAS_ENVIOS.length + 1} />
            )}
            {tabela.linhasVisiveis.map((envio) => (
              <tr key={envio.id}>
                <td data-rotulo="Data">{formatarDataHora(envio.createdAt)}</td>
                <td data-rotulo="Assunto">{envio.assunto}</td>
                <td data-rotulo="Modelo">{envio.modelo?.nome || "—"}</td>
                <td data-rotulo="Enviado por">{envio.criadoPor?.nome || "—"}</td>
                <td data-rotulo="Destinatários">{envio.total}</td>
                <td data-rotulo="Enviados">{envio.enviados}</td>
                <td data-rotulo="Falhas">{envio.falhas}</td>
                <td data-rotulo="Situação">
                  <span className={styles.tag}>{ROTULOS_SITUACAO_ENVIO[situacaoEnvio(envio)]}</span>
                </td>
                <td data-rotulo="Ações" className={styles.colunaAcoes}>
                  <div className={styles.acoesLinha}>
                    <button
                      type="button"
                      className={styles.botaoIcone}
                      aria-label={`Ver o envio ${envio.assunto}`}
                      title="Ver destinatários"
                      onClick={() => setDetalheId(envio.id)}
                    >
                      <Eye size={16} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detalheId && (
        <DetalheEnvioModal envioId={detalheId} onFechar={() => setDetalheId(null)} onRetomado={recarregar} />
      )}
    </>
  );
}

function situacaoDestinatario(destinatario) {
  if (destinatario.enviadoEm) return "ENVIADO";
  if (destinatario.erro) return "FALHA";
  return "PENDENTE";
}

const ROTULOS_SITUACAO_DESTINATARIO = { ENVIADO: "Enviado", FALHA: "Falha", PENDENTE: "Pendente" };

const COLUNAS_DESTINATARIOS = [
  { chave: "nome", rotulo: "Nome", valor: (destinatario) => destinatario.nome },
  { chave: "email", rotulo: "E-mail", valor: (destinatario) => destinatario.email },
  {
    chave: "situacao",
    rotulo: "Situação",
    valor: situacaoDestinatario,
    filtro: "select",
    opcoes: Object.entries(ROTULOS_SITUACAO_DESTINATARIO).map(([valor, rotulo]) => ({ valor, rotulo })),
    exportar: (destinatario) => ROTULOS_SITUACAO_DESTINATARIO[situacaoDestinatario(destinatario)],
  },
  {
    chave: "enviadoEm",
    rotulo: "Enviado em",
    valor: (destinatario) => (destinatario.enviadoEm ? new Date(destinatario.enviadoEm).getTime() : null),
    texto: (destinatario) => formatarDataHora(destinatario.enviadoEm),
    exportar: (destinatario) => formatarDataHora(destinatario.enviadoEm),
  },
  { chave: "erro", rotulo: "Erro", valor: (destinatario) => (destinatario.enviadoEm ? null : destinatario.erro) },
];

function DetalheEnvioModal({ envioId, onFechar, onRetomado }) {
  const { notificar } = useToast();
  const [envio, setEnvio] = useState(null);
  const [erro, setErro] = useState("");
  const [retomando, setRetomando] = useState(false);
  const tabela = useTabela(envio?.destinatarios || [], COLUNAS_DESTINATARIOS);

  const carregar = useCallback(async () => {
    const dados = await apiClient.get(`/emails/envios/${envioId}`);
    setEnvio(dados.envio);
  }, [envioId]);

  useEffect(() => {
    carregar().catch((falha) => setErro(falha.message));
  }, [carregar]);

  useEffect(() => {
    if (!envio?.emAndamento) return undefined;
    const intervalo = setInterval(() => carregar().catch(() => {}), INTERVALO_ATUALIZACAO_MS);
    return () => clearInterval(intervalo);
  }, [envio?.emAndamento, carregar]);

  async function retomar() {
    setRetomando(true);
    try {
      const { pendentes } = await apiClient.post(`/emails/envios/${envioId}/retomar`, {});
      notificar(`Envio retomado para ${pendentes} ${pendentes === 1 ? "destinatário" : "destinatários"}.`);
      await Promise.all([carregar(), onRetomado()]);
    } catch (falha) {
      notificar(falha.message, "erro");
    } finally {
      setRetomando(false);
    }
  }

  return (
    <Modal titulo={envio ? envio.assunto : "Envio"} onFechar={onFechar}>
      {!envio ? (
        <p className={styles.textoApoio}>{erro || "Carregando..."}</p>
      ) : (
        <div className={styles.detalhe}>
          <p className={styles.textoApoio}>
            {formatarDataHora(envio.createdAt)}
            {envio.criadoPor ? ` · por ${envio.criadoPor.nome}` : ""} · {envio.enviados} de {envio.total} enviados
            {envio.falhas > 0 ? ` · ${envio.falhas} com falha` : ""}
            {envio.emAndamento ? " · enviando…" : ""}
          </p>
          {!envio.emAndamento && envio.enviados < envio.total && (
            <div>
              <Botao type="button" onClick={retomar} carregando={retomando}>
                Retomar pendentes e falhas ({envio.total - envio.enviados})
              </Botao>
            </div>
          )}
          <details>
            <summary className={styles.rotuloBloco}>Texto enviado</summary>
            <ConteudoRichText className={styles.corpo} html={envio.corpo} tipo="texto" />
          </details>
          <div className={styles.tabelaWrapper}>
            <BotaoExportarTabela tabela={tabela} nomeArquivo="destinatarios" nomeAba="Destinatários" />
            <table className={styles.tabela}>
              <CabecalhoTabela tabela={tabela} idTabela="destinatarios-envio" comAcoes={false} />
              <tbody>
                {tabela.linhasVisiveis.length === 0 && (
                  <LinhaSemResultado tabela={tabela} colSpan={COLUNAS_DESTINATARIOS.length} />
                )}
                {tabela.linhasVisiveis.map((destinatario) => (
                  <tr key={destinatario.id}>
                    <td data-rotulo="Nome">{destinatario.nome}</td>
                    <td data-rotulo="E-mail">{destinatario.email}</td>
                    <td data-rotulo="Situação">{ROTULOS_SITUACAO_DESTINATARIO[situacaoDestinatario(destinatario)]}</td>
                    <td data-rotulo="Enviado em">{formatarDataHora(destinatario.enviadoEm) || "—"}</td>
                    <td data-rotulo="Erro">{destinatario.enviadoEm ? "—" : destinatario.erro || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}
