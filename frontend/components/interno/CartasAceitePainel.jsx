"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, RotateCcw, Ban, Mail } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import CampoCheckbox from "./CampoCheckbox";
import CartoesContadores from "./CartoesContadores";
import ModeloCertificadoForm, { formDoModelo } from "./ModeloCertificadoForm";
import CabecalhoTabela, { CelulaSelecao, LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela, { BotaoAcaoTabela } from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import useSelecaoLinhas from "./useSelecaoLinhas";
import { useToast } from "./ToastProvider";
import { cartasAceiteAdmin } from "@/lib/certificados";
import { criterioCartaAceiteSchema } from "@/lib/validacao";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./CertificadosPainel.module.scss";
import estilosCampo from "./CampoPrime.module.scss";

// Tela Submissões › Carta de aceite (seção SUBMISSOES_RESULTADO): uma carta
// por trabalho que atende o critério da edição (aba Critério), em nome do
// autor principal, liberada sozinha com a divulgação do resultado. A carta é o tipo CARTA_ACEITE dos certificados
// (backend: certificados.service.js, cartasAceite.controller.js) — mesmo
// editor de modelo, PDF, código de validação e envio por e-mail.

// Status que podem dar direito à carta (espelha DECISOES_CARTA em
// backend/src/utils/criterioCartaAceite.js).
const DECISOES_CARTA = [
  { valor: "APROVADO", rotulo: "Aprovado" },
  { valor: "APROVADO_COM_RESSALVAS", rotulo: "Aprovado com ressalvas" },
  { valor: "APROVADO_FORMATACAO", rotulo: "Aprovado para formatação (pendente de revisão)" },
];

const ROTULOS_SITUACAO = { VALIDA: "Válida", REVOGADA: "Revogada" };
const ROTULOS_REGRA = { ATENDE: "Atende", NAO_ATENDE: "Não atende mais" };
const ROTULOS_ENVIO = { NAO_ENVIADO: "Não enviado", PENDENTE: "Na fila", ENVIADO: "Enviado", ERRO: "Falhou" };

const situacaoDe = (c) => (c.revogadoEm ? "REVOGADA" : "VALIDA");
const regraDe = (c) => (c.foraDaRegra ? "NAO_ATENDE" : "ATENDE");

function formatarData(valor) {
  return valor ? new Date(valor).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "";
}

const textoEnvio = (c) =>
  c.situacaoEmail === "ENVIADO" ? `Enviado em ${formatarData(c.emailEnviadoEm)}` : ROTULOS_ENVIO[c.situacaoEmail];

const opcoesDe = (rotulos) => Object.entries(rotulos).map(([valor, rotulo]) => ({ valor, rotulo }));
const iguais = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const COLUNAS = [
  { chave: "nome", rotulo: "Autor principal", valor: (c) => c.nome },
  { chave: "email", rotulo: "E-mail", valor: (c) => c.email || null },
  { chave: "titulo", rotulo: "Trabalho", valor: (c) => c.titulo },
  { chave: "modalidade", rotulo: "Modalidade", valor: (c) => c.modalidade || null, filtro: "select" },
  { chave: "area", rotulo: "Área temática", valor: (c) => c.area || null, filtro: "select" },
  { chave: "codigo", rotulo: "Código", valor: (c) => c.codigo },
  {
    chave: "situacao",
    rotulo: "Situação",
    valor: situacaoDe,
    filtro: "select",
    opcoes: opcoesDe(ROTULOS_SITUACAO),
    exportar: (c) => ROTULOS_SITUACAO[situacaoDe(c)],
  },
  {
    chave: "regra",
    rotulo: "Regra",
    valor: regraDe,
    filtro: "select",
    opcoes: opcoesDe(ROTULOS_REGRA),
    exportar: (c) => ROTULOS_REGRA[regraDe(c)],
  },
  {
    chave: "envio",
    rotulo: "E-mail da carta",
    valor: (c) => c.situacaoEmail,
    filtro: "select",
    opcoes: opcoesDe(ROTULOS_ENVIO),
    exportar: textoEnvio,
  },
  {
    chave: "emitidoEm",
    rotulo: "Emitida em",
    valor: (c) => new Date(c.emitidoEm).getTime(),
    texto: (c) => formatarData(c.emitidoEm),
  },
];

export default function CartasAceitePainel({ edicaoId, dadosIniciais }) {
  const { notificar } = useToast();
  const [dados, setDados] = useState(dadosIniciais);
  const [abaAtiva, setAbaAtiva] = useState("cartas");
  // Rascunho do modelo fica aqui — trocar de aba não perde o que foi editado.
  const [form, setForm] = useState(() => (dadosIniciais ? formDoModelo(dadosIniciais.modelo) : null));

  const recarregar = useCallback(async () => {
    try {
      setDados(await cartasAceiteAdmin.listar(edicaoId));
    } catch (erro) {
      notificar(erro.message, "erro");
    }
  }, [edicaoId, notificar]);

  if (!dados) {
    return (
      <div className={styles.vazio}>
        <p>Não foi possível carregar as cartas de aceite.</p>
        <p className={styles.vazioApoio}>Recarregue a página para tentar de novo.</p>
      </div>
    );
  }

  const modeloAlterado = !iguais(form, formDoModelo(dados.modelo));

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Carta de aceite</h1>
          <p className={styles.descricao}>
            Uma carta por trabalho que atende o critério da edição, em nome do autor principal. Fica disponível em
            Minhas submissões a partir da divulgação do resultado, com QR code e código de validação pública.
          </p>
        </div>
      </div>

      <div className={styles.abas} role="tablist" aria-label="Seções da carta de aceite">
        {[
          { chave: "cartas", rotulo: `Cartas (${dados.cartas.length})` },
          { chave: "criterio", rotulo: "Critério" },
          { chave: "modelo", rotulo: modeloAlterado ? "Modelo •" : "Modelo" },
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

      {abaAtiva === "cartas" ? (
        <AbaCartas edicaoId={edicaoId} dados={dados} recarregar={recarregar} />
      ) : abaAtiva === "criterio" ? (
        <AbaCriterio edicaoId={edicaoId} dados={dados} recarregar={recarregar} />
      ) : (
        <ModeloCertificadoForm
          edicaoId={edicaoId}
          tipo="CARTA_ACEITE"
          form={form}
          alterarForm={setForm}
          modeloSalvo={dados.modelo}
          alterado={modeloAlterado}
          marcadores={dados.marcadores}
          exemplo={dados.exemplo}
          aoSalvar={(modelo) => {
            setDados((atual) => ({ ...atual, modelo }));
            setForm(formDoModelo(modelo));
          }}
          api={cartasAceiteAdmin}
        />
      )}
    </div>
  );
}

function AbaCartas({ edicaoId, dados, recarregar }) {
  const { notificar } = useToast();
  const tabela = useTabela(dados.cartas, COLUNAS);
  const selecao = useSelecaoLinhas(tabela);
  const [confirmacao, setConfirmacao] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [baixandoId, setBaixandoId] = useState(null);
  // null = fechado; { ids } = selecionadas; {} = todas.
  const [envioEmail, setEnvioEmail] = useState(null);
  const [retomando, setRetomando] = useState(false);

  const { resumo } = dados;
  const { enviando, pendentes, comErro } = dados.envioEmail;

  // Acompanha o envio em segundo plano.
  useEffect(() => {
    if (!enviando) return undefined;
    const intervalo = setInterval(recarregar, 5000);
    return () => clearInterval(intervalo);
  }, [enviando, recarregar]);

  if (!dados.divulgadoEm) {
    return (
      <div className={styles.vazio}>
        <p>O resultado desta edição ainda não foi divulgado.</p>
        <p className={styles.vazioApoio}>
          As cartas saem sozinhas quando o resultado for divulgado, em Submissões › Resultado. Enquanto isso, ajuste o
          texto e o papel timbrado na aba Modelo.
        </p>
      </div>
    );
  }

  const idsSelecionadosVisiveis = () =>
    tabela.linhasVisiveis.filter((linha) => selecao.estaSelecionado(linha.id)).map((linha) => linha.id);

  async function executar(acao) {
    setProcessando(true);
    try {
      const resposta = await acao();
      notificar(resposta.mensagem);
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessando(false);
      setConfirmacao(null);
    }
  }

  async function gerar() {
    setGerando(true);
    try {
      const resposta = await cartasAceiteAdmin.gerar(edicaoId);
      notificar(resposta.mensagem);
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setGerando(false);
    }
  }

  async function retomarEnvio() {
    setRetomando(true);
    try {
      const resposta = await cartasAceiteAdmin.retomarEnvioEmail(edicaoId);
      notificar(resposta.mensagem);
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setRetomando(false);
    }
  }

  async function baixar(carta) {
    setBaixandoId(carta.id);
    try {
      await cartasAceiteAdmin.baixar(edicaoId, carta);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setBaixandoId(null);
    }
  }

  function confirmarRevogar(carta) {
    setConfirmacao({
      titulo: "Revogar carta de aceite",
      mensagem: `A carta de ${carta.nome} (${carta.codigo}) some de Minhas submissões e a validação pública passa a mostrá-la como revogada. Dá para restaurar depois.`,
      rotulo: "Revogar",
      perigo: true,
      acao: () => cartasAceiteAdmin.revogar(edicaoId, carta.id),
    });
  }

  function confirmarRestaurar(carta) {
    setConfirmacao({
      titulo: "Restaurar carta de aceite",
      mensagem: `A carta de ${carta.nome} (${carta.codigo}) volta a valer, com o mesmo código.`,
      rotulo: "Restaurar",
      perigo: false,
      acao: () => cartasAceiteAdmin.restaurar(edicaoId, carta.id),
    });
  }

  function confirmarRevogarLote() {
    const ids = idsSelecionadosVisiveis();
    setConfirmacao({
      titulo: "Revogar cartas em lote",
      mensagem: `${ids.length} ${ids.length === 1 ? "carta será revogada" : "cartas serão revogadas"} (as já revogadas ficam como estão).`,
      rotulo: "Revogar",
      perigo: true,
      acao: async () => {
        const resposta = await cartasAceiteAdmin.revogarEmLote(edicaoId, ids);
        selecao.limpar();
        return resposta;
      },
    });
  }

  return (
    <>
      <CartoesContadores
        itens={[
          { rotulo: "Trabalhos com direito", valor: resumo.elegiveis },
          { rotulo: "Cartas válidas", valor: resumo.emitidas, tom: "sucesso" },
          { rotulo: "A gerar", valor: resumo.novas, tom: resumo.novas ? "alerta" : undefined },
          { rotulo: "Revogadas", valor: resumo.revogadas },
        ]}
      />

      <div className={styles.barraAcoes}>
        <p className={styles.textoApoio}>
          As cartas são criadas na divulgação e a cada correção concluída (e também quando o autor baixa a dele).
          &quot;Atualizar cartas&quot; cria as que faltarem e atualiza título, área e nomes das já emitidas, mantendo o
          código.
        </p>
        <div className={estilos.acoesCartao}>
          <Botao type="button" variante="secundario" carregando={gerando} onClick={gerar}>
            <RefreshCw size={18} strokeWidth={1.5} aria-hidden="true" />
            Atualizar cartas
          </Botao>
          <Botao
            type="button"
            variante="secundario"
            disabled={dados.cartas.length === 0}
            onClick={() => setEnvioEmail({})}
          >
            <Mail size={18} strokeWidth={1.5} aria-hidden="true" />
            Enviar por e-mail
          </Botao>
        </div>
      </div>

      {(enviando || pendentes > 0 || comErro > 0) && (
        <div className={estilos.statusEnvio} role="status">
          <span>
            {enviando
              ? `Enviando por e-mail… ${pendentes} ${pendentes === 1 ? "carta" : "cartas"} na fila.`
              : `Envio por e-mail parado: ${pendentes} na fila${comErro > 0 ? `, ${comErro} com falha` : ""}.`}
          </span>
          {!enviando && (
            <Botao type="button" variante="secundario" carregando={retomando} onClick={retomarEnvio}>
              <RotateCcw size={16} strokeWidth={1.5} aria-hidden="true" />
              Retomar pendentes e falhas
            </Botao>
          )}
        </div>
      )}

      {dados.cartas.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhuma carta emitida ainda.</p>
          <p className={styles.vazioApoio}>
            {resumo.novas > 0
              ? 'Use "Atualizar cartas" para criar as cartas dos trabalhos que têm direito.'
              : "Nenhum trabalho atende o critério da carta ainda — confira a aba Critério."}
          </p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <BotaoExportarTabela tabela={tabela} nomeArquivo="cartas-de-aceite" nomeAba="Cartas de aceite">
            {selecao.quantidade > 0 && (
              <BotaoAcaoTabela onClick={() => setEnvioEmail({ ids: idsSelecionadosVisiveis() })}>
                <Mail size={16} strokeWidth={1.5} aria-hidden="true" />
                Enviar por e-mail ({selecao.quantidade})
              </BotaoAcaoTabela>
            )}
            {selecao.quantidade > 0 && (
              <BotaoAcaoTabela perigo onClick={confirmarRevogarLote}>
                <Ban size={16} strokeWidth={1.5} aria-hidden="true" />
                Revogar ({selecao.quantidade})
              </BotaoAcaoTabela>
            )}
          </BotaoExportarTabela>
          <table className={styles.tabela}>
            <CabecalhoTabela tabela={tabela} idTabela="cartas-aceite" classeAcoes={styles.colunaAcoes} selecao={selecao} />
            <tbody>
              {tabela.linhasVisiveis.length === 0 && <LinhaSemResultado tabela={tabela} colSpan={COLUNAS.length + 2} />}
              {tabela.linhasVisiveis.map((carta) => (
                <tr key={carta.id}>
                  <CelulaSelecao selecao={selecao} id={carta.id} rotulo={`Selecionar carta de ${carta.nome}`} />
                  <td data-rotulo="Autor principal">{carta.nome}</td>
                  <td data-rotulo="E-mail">{carta.email || "—"}</td>
                  <td data-rotulo="Trabalho">{carta.titulo}</td>
                  <td data-rotulo="Modalidade">{carta.modalidade || "—"}</td>
                  <td data-rotulo="Área temática">{carta.area || "—"}</td>
                  <td data-rotulo="Código">
                    <code>{carta.codigo}</code>
                  </td>
                  <td data-rotulo="Situação" title={carta.motivoRevogacao || undefined}>
                    {carta.revogadoEm ? <strong>{ROTULOS_SITUACAO.REVOGADA}</strong> : ROTULOS_SITUACAO.VALIDA}
                  </td>
                  <td data-rotulo="Regra">
                    {carta.foraDaRegra ? <strong>{ROTULOS_REGRA.NAO_ATENDE}</strong> : ROTULOS_REGRA.ATENDE}
                  </td>
                  <td data-rotulo="E-mail da carta" title={carta.emailErro || undefined}>
                    {carta.situacaoEmail === "ERRO" ? <strong>{ROTULOS_ENVIO.ERRO}</strong> : textoEnvio(carta)}
                  </td>
                  <td data-rotulo="Emitida em">{formatarData(carta.emitidoEm)}</td>
                  <td data-rotulo="Ações" className={styles.colunaAcoes}>
                    <div className={styles.acoesLinha}>
                      <button
                        type="button"
                        className={styles.botaoIcone}
                        aria-label={`Baixar carta de ${carta.nome}`}
                        title="Baixar PDF"
                        disabled={baixandoId === carta.id}
                        onClick={() => baixar(carta)}
                      >
                        <Download size={16} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                      {carta.revogadoEm ? (
                        <button
                          type="button"
                          className={styles.botaoIcone}
                          aria-label={`Restaurar carta de ${carta.nome}`}
                          title="Restaurar"
                          onClick={() => confirmarRestaurar(carta)}
                        >
                          <RotateCcw size={16} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                          aria-label={`Revogar carta de ${carta.nome}`}
                          title="Revogar"
                          onClick={() => confirmarRevogar(carta)}
                        >
                          <Ban size={16} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {envioEmail && (
        <ModalEnviarCartas
          edicaoId={edicaoId}
          cartas={dados.cartas}
          idsSelecionados={envioEmail.ids}
          onFechar={() => setEnvioEmail(null)}
          onEnviado={async () => {
            setEnvioEmail(null);
            if (envioEmail.ids) selecao.limpar();
            await recarregar();
          }}
        />
      )}

      {confirmacao && (
        <ModalConfirmacao
          titulo={confirmacao.titulo}
          mensagem={confirmacao.mensagem}
          rotuloConfirmar={confirmacao.rotulo}
          perigo={confirmacao.perigo}
          confirmando={processando}
          onConfirmar={() => executar(confirmacao.acao)}
          onCancelar={() => setConfirmacao(null)}
        />
      )}
    </>
  );
}

// Quem tem direito à carta. Com o resultado divulgado, salvar já cria as
// cartas de quem passou a ter direito; as de quem deixou de ter continuam
// válidas até serem revogadas (coluna Regra da aba Cartas).
function AbaCriterio({ edicaoId, dados, recarregar }) {
  const { notificar } = useToast();
  const [form, setForm] = useState(dados.criterio);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const alterado = !iguais(
    { ...form, decisoes: [...form.decisoes].sort() },
    { ...dados.criterio, decisoes: [...dados.criterio.decisoes].sort() }
  );

  function alternarDecisao(valor, marcado) {
    setErro(null);
    setForm((atual) => ({
      ...atual,
      decisoes: marcado ? [...atual.decisoes, valor] : atual.decisoes.filter((item) => item !== valor),
    }));
  }

  async function salvar(evento) {
    evento.preventDefault();
    const resultado = criterioCartaAceiteSchema.safeParse(form);
    if (!resultado.success) {
      setErro(resultado.error.issues[0].message);
      notificar(resultado.error.issues[0].message, "erro");
      return;
    }
    setSalvando(true);
    try {
      const resposta = await cartasAceiteAdmin.salvarCriterio(edicaoId, form);
      notificar(resposta.mensagem);
      setForm(resposta.criterio);
      await recarregar();
    } catch (falha) {
      notificar(falha.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className={estilos.secao} onSubmit={salvar} noValidate>
      <div>
        <h3 className={estilos.tituloSecao}>Quem recebe a carta</h3>
        <p className={estilos.descricaoSecao}>
          Os trabalhos com estes status recebem a carta de aceite, em nome do autor principal.{" "}
          {dados.divulgadoEm
            ? "Ao salvar, as cartas de quem passou a ter direito são criadas na hora; as já emitidas de quem deixou de ter continuam válidas até você revogá-las (coluna Regra da aba Cartas)."
            : "Vale a partir da divulgação do resultado."}
        </p>
      </div>
      <fieldset className={estilos.grupoEnvio}>
        <legend className={styles.textoApoio}>Status da submissão</legend>
        {DECISOES_CARTA.map((decisao) => (
          <CampoCheckbox
            key={decisao.valor}
            id={`carta-decisao-${decisao.valor}`}
            rotulo={decisao.rotulo}
            checked={form.decisoes.includes(decisao.valor)}
            onChange={(marcado) => alternarDecisao(decisao.valor, marcado)}
          />
        ))}
        {erro && (
          <p className={estilosCampo.mensagemErro} role="alert">
            {erro}
          </p>
        )}
      </fieldset>
      <CampoCheckbox
        id="carta-exigir-correcao"
        rotulo="Só com a revisão ou correção concluída (vale para “com ressalvas” e “para formatação”)"
        checked={form.exigirCorrecaoConcluida}
        onChange={(marcado) => setForm((atual) => ({ ...atual, exigirCorrecaoConcluida: marcado }))}
      />
      <div className={estilos.acoesCartao}>
        <Botao type="submit" carregando={salvando} disabled={!alterado}>
          Salvar critério
        </Botao>
      </div>
    </form>
  );
}

// Mesma regra do backend (solicitarEnvioEmail): só carta válida com e-mail;
// sem "reenviar", só quem ainda não recebeu.
function ModalEnviarCartas({ edicaoId, cartas, idsSelecionados, onFechar, onEnviado }) {
  const { notificar } = useToast();
  const [reenviar, setReenviar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const contagem = useMemo(() => {
    const selecionadas = idsSelecionados ? new Set(idsSelecionados) : null;
    const resultado = { enviar: 0, jaEnviadas: 0, semEmail: 0, revogadas: 0 };
    for (const carta of cartas) {
      if (selecionadas && !selecionadas.has(carta.id)) continue;
      if (carta.revogadoEm) resultado.revogadas += 1;
      else if (!carta.email) resultado.semEmail += 1;
      else if (carta.situacaoEmail === "ENVIADO" && !reenviar) resultado.jaEnviadas += 1;
      else resultado.enviar += 1;
    }
    return resultado;
  }, [cartas, idsSelecionados, reenviar]);

  const foraDoEnvio = [
    contagem.jaEnviadas > 0 ? `${contagem.jaEnviadas} já ${contagem.jaEnviadas === 1 ? "recebeu" : "receberam"}` : null,
    contagem.semEmail > 0 ? `${contagem.semEmail} sem e-mail` : null,
    contagem.revogadas > 0 ? `${contagem.revogadas} ${contagem.revogadas === 1 ? "revogada" : "revogadas"}` : null,
  ].filter(Boolean);

  async function enviar() {
    setEnviando(true);
    try {
      const resposta = await cartasAceiteAdmin.enviarPorEmail(
        edicaoId,
        idsSelecionados ? { ids: idsSelecionados, reenviar } : { reenviar }
      );
      notificar(resposta.mensagem);
      onEnviado();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Enviar cartas de aceite por e-mail" onFechar={onFechar}>
      <div className={styles.formulario}>
        <p className={styles.textoApoio}>
          Cada autor principal recebe um e-mail com o link da carta, onde confere a validade e baixa o PDF, sem precisar
          de conta. O envio roda em segundo plano, um e-mail por vez.
        </p>
        <p className={styles.textoApoio}>
          {idsSelecionados ? "Das cartas selecionadas" : "De todas as cartas"}: {contagem.enviar} a enviar
          {foraDoEnvio.length > 0 ? ` (${foraDoEnvio.join(", ")} ${foraDoEnvio.length === 1 ? "fica" : "ficam"} de fora)` : ""}.
        </p>
        <CampoCheckbox
          id="cartas-reenviar"
          rotulo="Reenviar também para quem já recebeu"
          checked={reenviar}
          onChange={setReenviar}
        />
        <div className={styles.acoesFormulario}>
          <Botao type="button" variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao type="button" carregando={enviando} disabled={contagem.enviar === 0} onClick={enviar}>
            {contagem.enviar === 0
              ? "Nada a enviar"
              : `Enviar ${contagem.enviar} ${contagem.enviar === 1 ? "e-mail" : "e-mails"}`}
          </Botao>
        </div>
      </div>
    </Modal>
  );
}
