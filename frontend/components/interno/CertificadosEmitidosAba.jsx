"use client";

import { useMemo, useState } from "react";
import { Download, RefreshCw, RotateCcw, Ban, Eye, EyeOff, UserPlus } from "lucide-react";
import Botao from "@/components/forms/Botao";
import BuscaUsuario from "./BuscaUsuario";
import CampoSelecao from "./CampoSelecao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import CabecalhoTabela, { CelulaSelecao, LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela, { BotaoAcaoTabela } from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import useSelecaoLinhas from "./useSelecaoLinhas";
import { useToast } from "./ToastProvider";
import { ROTULOS_TIPO_CERTIFICADO, certificadosAdmin } from "@/lib/certificados";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./CertificadosPainel.module.scss";

const ROTULOS_SITUACAO = { DISPONIVEL: "Disponível", NAO_LIBERADO: "Não liberado", REVOGADO: "Revogado" };
const ROTULOS_REGRA = { ATENDE: "Atende", NAO_ATENDE: "Não atende mais", MANUAL: "Incluído manualmente" };

const situacaoDe = (c) => (c.revogadoEm ? "REVOGADO" : c.liberado ? "DISPONIVEL" : "NAO_LIBERADO");
const regraDe = (c) => (c.origem === "MANUAL" ? "MANUAL" : c.foraDaRegra ? "NAO_ATENDE" : "ATENDE");

function formatarData(valor) {
  return valor ? new Date(valor).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "";
}

const opcoesDe = (rotulos) => Object.entries(rotulos).map(([valor, rotulo]) => ({ valor, rotulo }));

const COLUNAS = [
  { chave: "nome", rotulo: "Nome", valor: (c) => c.nome },
  { chave: "email", rotulo: "E-mail", valor: (c) => c.email || null },
  {
    chave: "tipo",
    rotulo: "Tipo",
    valor: (c) => c.tipo,
    filtro: "select",
    opcoes: opcoesDe(ROTULOS_TIPO_CERTIFICADO),
    exportar: (c) => ROTULOS_TIPO_CERTIFICADO[c.tipo],
  },
  { chave: "referencia", rotulo: "Atividade / trabalho", valor: (c) => c.referencia || null },
  { chave: "carga", rotulo: "Carga horária", valor: (c) => c.cargaHoraria ?? null },
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
    chave: "emitidoEm",
    rotulo: "Emitido em",
    valor: (c) => new Date(c.emitidoEm).getTime(),
    texto: (c) => formatarData(c.emitidoEm),
  },
];

const TIPOS_MANUAIS = ["PARTICIPACAO_EVENTO", "PRESENCA_ATIVIDADE", "AVALIADOR", "MONITOR"];

function ModalIncluirCertificado({ edicaoId, atividades, onFechar, onIncluido }) {
  const { notificar } = useToast();
  const [tipo, setTipo] = useState("PARTICIPACAO_EVENTO");
  const [usuario, setUsuario] = useState(null);
  const [atividadeId, setAtividadeId] = useState("");
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  async function incluir(evento) {
    evento.preventDefault();
    const novos = {};
    if (!usuario) novos.usuario = "Escolha a pessoa";
    if (tipo === "PRESENCA_ATIVIDADE" && !atividadeId) novos.atividade = "Escolha a atividade";
    setErros(novos);
    if (Object.keys(novos).length > 0) return;

    setEnviando(true);
    try {
      const resposta = await certificadosAdmin.incluirManual(edicaoId, {
        tipo,
        usuarioId: usuario.id,
        atividadeId: tipo === "PRESENCA_ATIVIDADE" ? atividadeId : null,
      });
      notificar(resposta.mensagem);
      onIncluido();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Incluir certificado manualmente" onFechar={onFechar}>
      <form className={styles.formulario} onSubmit={incluir} noValidate>
        <p className={styles.textoApoio}>
          Para quem tem direito mas ficou fora da regra (ex. presença não registrada). Certificados de apresentação de
          trabalho saem só pela regra.
        </p>
        <CampoSelecao id="incluir-tipo" rotulo="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {TIPOS_MANUAIS.map((valor) => (
            <option key={valor} value={valor}>
              {ROTULOS_TIPO_CERTIFICADO[valor]}
            </option>
          ))}
        </CampoSelecao>
        <BuscaUsuario
          id="incluir-usuario"
          rotulo="Pessoa"
          usuarioSelecionado={usuario}
          onSelecionar={setUsuario}
          erro={erros.usuario}
        />
        {tipo === "PRESENCA_ATIVIDADE" && (
          <CampoSelecao
            id="incluir-atividade"
            rotulo="Atividade"
            value={atividadeId}
            onChange={(e) => setAtividadeId(e.target.value)}
            erro={erros.atividade}
          >
            <option value="">Escolha a atividade</option>
            {atividades.map((atividade) => (
              <option key={atividade.id} value={atividade.id}>
                {atividade.nome}
              </option>
            ))}
          </CampoSelecao>
        )}
        <div className={styles.acoesFormulario}>
          <Botao type="button" variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" carregando={enviando}>
            Incluir
          </Botao>
        </div>
      </form>
    </Modal>
  );
}

export default function CertificadosEmitidosAba({ edicaoId, dados, recarregar }) {
  const { notificar } = useToast();
  const tabela = useTabela(dados.certificados, COLUNAS);
  const selecao = useSelecaoLinhas(tabela);
  const [confirmacao, setConfirmacao] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [baixandoId, setBaixandoId] = useState(null);
  const [incluindo, setIncluindo] = useState(false);

  const tipos = useMemo(() => dados.tipos.map((t) => t.tipo), [dados.tipos]);

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

  async function baixar(certificado) {
    setBaixandoId(certificado.id);
    try {
      await certificadosAdmin.baixar(edicaoId, certificado);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setBaixandoId(null);
    }
  }

  function confirmarGerar(tipo) {
    const resumo = dados.resumo[tipo];
    const rotulo = ROTULOS_TIPO_CERTIFICADO[tipo];
    setConfirmacao({
      titulo: `Gerar certificados — ${rotulo}`,
      mensagem:
        resumo.novos > 0
          ? `${resumo.novos} ${resumo.novos === 1 ? "certificado novo será criado" : "certificados novos serão criados"} para quem tem direito e ainda não tem. Os já emitidos têm os dados atualizados (nome, atividade, carga) e mantêm o código; os revogados continuam revogados.`
          : "Ninguém novo tem direito a este certificado. Os já emitidos terão os dados atualizados (nome, atividade, carga), mantendo o código.",
      rotulo: "Gerar",
      perigo: false,
      acao: () => certificadosAdmin.gerar(edicaoId, tipo),
    });
  }

  function confirmarLiberacao(tipo, liberar) {
    const rotulo = ROTULOS_TIPO_CERTIFICADO[tipo];
    setConfirmacao({
      titulo: liberar ? `Liberar certificados — ${rotulo}` : `Ocultar certificados — ${rotulo}`,
      mensagem: liberar
        ? "Os certificados emitidos deste tipo (e os que forem gerados depois) ficam disponíveis para download na área do participante e passam a ser validados publicamente pelo código."
        : "Os participantes deixam de ver e baixar os certificados deste tipo, e a validação pública passa a não encontrá-los. Nada é apagado.",
      rotulo: liberar ? "Liberar" : "Ocultar",
      perigo: !liberar,
      acao: () => certificadosAdmin.definirLiberacao(edicaoId, tipo, liberar),
    });
  }

  function confirmarRevogar(certificado) {
    setConfirmacao({
      titulo: "Revogar certificado",
      mensagem: `O certificado de ${certificado.nome} (${certificado.codigo}) some da área do participante e a validação pública passa a mostrá-lo como revogado. Dá para restaurar depois.`,
      rotulo: "Revogar",
      perigo: true,
      acao: () => certificadosAdmin.revogar(edicaoId, certificado.id),
    });
  }

  function confirmarRestaurar(certificado) {
    setConfirmacao({
      titulo: "Restaurar certificado",
      mensagem: `O certificado de ${certificado.nome} (${certificado.codigo}) volta a valer, com o mesmo código.`,
      rotulo: "Restaurar",
      perigo: false,
      acao: () => certificadosAdmin.restaurar(edicaoId, certificado.id),
    });
  }

  function confirmarRevogarLote() {
    const ids = tabela.linhasVisiveis.filter((linha) => selecao.estaSelecionado(linha.id)).map((linha) => linha.id);
    setConfirmacao({
      titulo: "Revogar certificados em lote",
      mensagem: `${ids.length} ${ids.length === 1 ? "certificado será revogado" : "certificados serão revogados"} (os já revogados ficam como estão).`,
      rotulo: "Revogar",
      perigo: true,
      acao: async () => {
        const resposta = await certificadosAdmin.revogarEmLote(edicaoId, ids);
        selecao.limpar();
        return resposta;
      },
    });
  }

  return (
    <>
      <div className={estilos.gradeTipos}>
        {tipos.map((tipo) => {
          const resumo = dados.resumo[tipo];
          const modelo = dados.modelos[tipo];
          return (
            <article key={tipo} className={estilos.cartaoTipo}>
              <div className={estilos.cabecalhoCartao}>
                <h3 className={estilos.tituloCartao}>{ROTULOS_TIPO_CERTIFICADO[tipo]}</h3>
                <span className={modelo.liberadoEm ? styles.tag : estilos.tagNeutra}>
                  {modelo.liberadoEm ? `Liberado em ${formatarData(modelo.liberadoEm)}` : "Não liberado"}
                </span>
              </div>
              <dl className={estilos.numeros}>
                <div>
                  <dt>Emitidos</dt>
                  <dd>{resumo.emitidos}</dd>
                </div>
                <div>
                  <dt>Novos a gerar</dt>
                  <dd>{resumo.novos}</dd>
                </div>
                <div>
                  <dt>Revogados</dt>
                  <dd>{resumo.revogados}</dd>
                </div>
              </dl>
              {resumo.foraDaRegra > 0 && (
                <p className={styles.textoApoio}>
                  {resumo.foraDaRegra} {resumo.foraDaRegra === 1 ? "emitido não atende" : "emitidos não atendem"} mais à
                  regra — revise na tabela (coluna Regra).
                </p>
              )}
              <div className={estilos.acoesCartao}>
                <Botao type="button" variante="secundario" onClick={() => confirmarGerar(tipo)}>
                  <RefreshCw size={16} strokeWidth={1.5} aria-hidden="true" />
                  Gerar
                </Botao>
                {modelo.liberadoEm ? (
                  <Botao type="button" variante="secundario" onClick={() => confirmarLiberacao(tipo, false)}>
                    <EyeOff size={16} strokeWidth={1.5} aria-hidden="true" />
                    Ocultar
                  </Botao>
                ) : (
                  <Botao
                    type="button"
                    variante="secundario"
                    disabled={!modelo.salvo}
                    title={modelo.salvo ? undefined : "Salve o modelo deste tipo antes de liberar"}
                    onClick={() => confirmarLiberacao(tipo, true)}
                  >
                    <Eye size={16} strokeWidth={1.5} aria-hidden="true" />
                    Liberar
                  </Botao>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className={styles.barraAcoes}>
        <p className={styles.textoApoio}>
          Gerar cria os certificados de quem tem direito pela regra do tipo; liberar deixa o tipo disponível na área do
          participante.
        </p>
        <Botao type="button" variante="secundario" onClick={() => setIncluindo(true)}>
          <UserPlus size={18} strokeWidth={1.5} aria-hidden="true" />
          Incluir manualmente
        </Botao>
      </div>

      {dados.certificados.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhum certificado emitido ainda.</p>
          <p className={styles.vazioApoio}>Configure o modelo na aba Modelos e use &quot;Gerar&quot; em cada tipo.</p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <BotaoExportarTabela tabela={tabela} nomeArquivo="certificados" nomeAba="Certificados">
            {selecao.quantidade > 0 && (
              <BotaoAcaoTabela perigo onClick={confirmarRevogarLote}>
                <Ban size={16} strokeWidth={1.5} aria-hidden="true" />
                Revogar ({selecao.quantidade})
              </BotaoAcaoTabela>
            )}
          </BotaoExportarTabela>
          <table className={styles.tabela}>
            <CabecalhoTabela tabela={tabela} idTabela="certificados" classeAcoes={styles.colunaAcoes} selecao={selecao} />
            <tbody>
              {tabela.linhasVisiveis.length === 0 && <LinhaSemResultado tabela={tabela} colSpan={COLUNAS.length + 2} />}
              {tabela.linhasVisiveis.map((certificado) => (
                <tr key={certificado.id}>
                  <CelulaSelecao selecao={selecao} id={certificado.id} rotulo={`Selecionar ${certificado.nome}`} />
                  <td data-rotulo="Nome">{certificado.nome}</td>
                  <td data-rotulo="E-mail">{certificado.email || "—"}</td>
                  <td data-rotulo="Tipo">{ROTULOS_TIPO_CERTIFICADO[certificado.tipo]}</td>
                  <td data-rotulo="Atividade / trabalho">{certificado.referencia || "—"}</td>
                  <td data-rotulo="Carga horária">{certificado.cargaHoraria != null ? `${certificado.cargaHoraria} h` : "—"}</td>
                  <td data-rotulo="Código">
                    <code>{certificado.codigo}</code>
                  </td>
                  <td data-rotulo="Situação">
                    {certificado.revogadoEm ? (
                      <strong>Revogado</strong>
                    ) : (
                      ROTULOS_SITUACAO[situacaoDe(certificado)]
                    )}
                  </td>
                  <td data-rotulo="Regra">
                    {certificado.foraDaRegra ? <strong>{ROTULOS_REGRA.NAO_ATENDE}</strong> : ROTULOS_REGRA[regraDe(certificado)]}
                  </td>
                  <td data-rotulo="Emitido em">{formatarData(certificado.emitidoEm)}</td>
                  <td data-rotulo="Ações" className={styles.colunaAcoes}>
                    <div className={styles.acoesLinha}>
                      <button
                        type="button"
                        className={styles.botaoIcone}
                        aria-label={`Baixar certificado de ${certificado.nome}`}
                        title="Baixar PDF"
                        disabled={baixandoId === certificado.id}
                        onClick={() => baixar(certificado)}
                      >
                        <Download size={16} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                      {certificado.revogadoEm ? (
                        <button
                          type="button"
                          className={styles.botaoIcone}
                          aria-label={`Restaurar certificado de ${certificado.nome}`}
                          title="Restaurar"
                          onClick={() => confirmarRestaurar(certificado)}
                        >
                          <RotateCcw size={16} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                          aria-label={`Revogar certificado de ${certificado.nome}`}
                          title="Revogar"
                          onClick={() => confirmarRevogar(certificado)}
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

      {incluindo && (
        <ModalIncluirCertificado
          edicaoId={edicaoId}
          atividades={dados.atividades}
          onFechar={() => setIncluindo(false)}
          onIncluido={async () => {
            setIncluindo(false);
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
