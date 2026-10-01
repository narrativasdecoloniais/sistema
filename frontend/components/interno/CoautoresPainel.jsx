"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link2, Pencil, Send, Trash2 } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Alerta from "@/components/forms/Alerta";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import CampoTexto from "./CampoTexto";
import BuscaUsuario from "./BuscaUsuario";
import CabecalhoTabela, { CelulaSelecao, LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela, { BotaoAcaoTabela } from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import useSelecaoLinhas from "./useSelecaoLinhas";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { atualizarCoautorSchema, extrairErros } from "@/lib/validacao";
import { ROTULOS_SITUACAO_COAUTOR, formatarDataHoraCurta } from "@/lib/coautores";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";

const INTERVALO_ATUALIZACAO_MS = 4000;
const PENDENTES = ["NAO_ENVIADO", "FALHA_ENVIO"];

const COLUNAS = [
  { chave: "nome", rotulo: "Nome", valor: (coautor) => coautor.nome },
  { chave: "email", rotulo: "E-mail", valor: (coautor) => coautor.email },
  { chave: "trabalho", rotulo: "Trabalho", valor: (coautor) => coautor.submissao.titulo },
  { chave: "principal", rotulo: "Autor principal", valor: (coautor) => coautor.autorPrincipal },
  {
    chave: "situacao",
    rotulo: "Situação",
    valor: (coautor) => coautor.situacao,
    filtro: "select",
    opcoes: Object.entries(ROTULOS_SITUACAO_COAUTOR).map(([valor, rotulo]) => ({ valor, rotulo })),
    exportar: (coautor) => ROTULOS_SITUACAO_COAUTOR[coautor.situacao],
  },
  {
    chave: "enviadoEm",
    rotulo: "Último envio",
    valor: (coautor) => (coautor.enviadoEm ? new Date(coautor.enviadoEm).getTime() : null),
    texto: (coautor) => formatarDataHoraCurta(coautor.enviadoEm),
    exportar: (coautor) => formatarDataHoraCurta(coautor.enviadoEm),
  },
];

function contar(coautores, situacoes) {
  return coautores.filter((coautor) => situacoes.includes(coautor.situacao)).length;
}

export default function CoautoresPainel({ edicaoId, coautoresIniciais, envioInicial }) {
  const { notificar } = useToast();
  const [coautores, setCoautores] = useState(coautoresIniciais);
  const [envio, setEnvio] = useState(envioInicial);
  const [confirmarPendentes, setConfirmarPendentes] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [vinculando, setVinculando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [processando, setProcessando] = useState(false);

  const tabela = useTabela(coautores, COLUNAS);
  const selecao = useSelecaoLinhas(tabela);

  const base = `/edicoes/${edicaoId}/coautores`;
  const pendentes = contar(coautores, PENDENTES);
  const selecionadosSemConta = useMemo(
    () => coautores.filter((coautor) => selecao.estaSelecionado(coautor.id) && coautor.situacao !== "CADASTRADO"),
    [coautores, selecao]
  );

  const recarregar = useCallback(async () => {
    const dados = await apiClient.get(base);
    setCoautores(dados?.coautores || []);
    setEnvio(dados?.envio || { enviando: false, naFila: 0 });
  }, [base]);

  // Enquanto a fila de convites anda, a situação de cada linha muda sozinha.
  useEffect(() => {
    if (!envio.enviando) return undefined;
    const intervalo = setInterval(() => recarregar().catch(() => {}), INTERVALO_ATUALIZACAO_MS);
    return () => clearInterval(intervalo);
  }, [envio.enviando, recarregar]);

  async function enviar(caminho, corpo, aoConcluir) {
    setEnviando(true);
    try {
      const { enfileirados } = await apiClient.post(`${base}/convites/${caminho}`, corpo);
      notificar(
        enfileirados > 0
          ? `${enfileirados} ${enfileirados === 1 ? "convite entrou" : "convites entraram"} na fila de envio.`
          : "Nenhum convite a enviar."
      );
      aoConcluir?.();
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setEnviando(false);
    }
  }

  async function excluir() {
    setProcessando(true);
    try {
      await apiClient.delete(`${base}/${excluindo.id}`);
      notificar("Coautor excluído do trabalho.");
      setExcluindo(null);
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Coautores</h1>
          <p className={styles.descricao}>
            Coautores dos trabalhos desta edição e se já têm cadastro na plataforma. Quem não tem recebe um convite
            com link de cadastro já com o e-mail do trabalho — ou para vincular o trabalho a uma conta que já tem.
          </p>
          <p className={styles.textoApoio}>
            {contar(coautores, ["CADASTRADO"])} cadastrados · {contar(coautores, ["CONVITE_ENVIADO"])} com convite
            enviado · {contar(coautores, ["FALHA_ENVIO"])} com falha · {contar(coautores, ["NAO_ENVIADO"])} sem convite
            {envio.enviando && ` · enviando (${envio.naFila} na fila)`}
          </p>
        </div>
        <Botao
          type="button"
          onClick={() => setConfirmarPendentes(true)}
          disabled={pendentes === 0 || envio.enviando}
          carregando={enviando && confirmarPendentes}
        >
          <Send size={18} strokeWidth={1.5} aria-hidden="true" />
          Enviar convites pendentes ({pendentes})
        </Botao>
      </div>

      {coautores.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhum coautor nos trabalhos desta edição.</p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <BotaoExportarTabela tabela={tabela} nomeArquivo="coautores" nomeAba="Coautores">
            {selecionadosSemConta.length > 0 && (
              <BotaoAcaoTabela
                disabled={enviando}
                onClick={() =>
                  enviar("em-lote", { autorIds: selecionadosSemConta.map((coautor) => coautor.id) }, selecao.limpar)
                }
              >
                <Send size={16} strokeWidth={1.5} aria-hidden="true" />
                Enviar convite ({selecionadosSemConta.length})
              </BotaoAcaoTabela>
            )}
          </BotaoExportarTabela>
          <table className={styles.tabela}>
            <CabecalhoTabela tabela={tabela} idTabela="coautores" classeAcoes={styles.colunaAcoes} selecao={selecao} />
            <tbody>
              {tabela.linhasVisiveis.length === 0 && <LinhaSemResultado tabela={tabela} colSpan={COLUNAS.length + 2} />}
              {tabela.linhasVisiveis.map((coautor) => {
                const semConta = coautor.situacao !== "CADASTRADO";
                return (
                  <tr key={coautor.id}>
                    <CelulaSelecao selecao={selecao} id={coautor.id} rotulo={`Selecionar ${coautor.nome}`} />
                    <td data-rotulo="Nome">{coautor.nome}</td>
                    <td data-rotulo="E-mail">{coautor.email}</td>
                    <td data-rotulo="Trabalho">{coautor.submissao.titulo}</td>
                    <td data-rotulo="Autor principal">{coautor.autorPrincipal}</td>
                    <td data-rotulo="Situação">
                      {coautor.situacao === "CADASTRADO" ? (
                        <span className={styles.tag}>{ROTULOS_SITUACAO_COAUTOR.CADASTRADO}</span>
                      ) : (
                        <span title={coautor.erroEnvio || undefined}>{ROTULOS_SITUACAO_COAUTOR[coautor.situacao]}</span>
                      )}
                    </td>
                    <td data-rotulo="Último envio">{formatarDataHoraCurta(coautor.enviadoEm) || "—"}</td>
                    <td data-rotulo="Ações" className={styles.colunaAcoes}>
                      <div className={styles.acoesLinha}>
                        <button
                          type="button"
                          className={styles.botaoIcone}
                          aria-label={`Editar ${coautor.nome}`}
                          title="Editar nome e e-mail"
                          onClick={() => setEditando(coautor)}
                        >
                          <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                        {semConta && (
                          <>
                            <button
                              type="button"
                              className={styles.botaoIcone}
                              aria-label={`Vincular ${coautor.nome} a uma conta`}
                              title="Vincular a uma conta existente (cadastro com outro e-mail)"
                              onClick={() => setVinculando(coautor)}
                            >
                              <Link2 size={16} strokeWidth={1.5} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className={styles.botaoIcone}
                              aria-label={`Enviar convite a ${coautor.nome}`}
                              title={coautor.enviadoEm ? "Reenviar convite" : "Enviar convite"}
                              disabled={enviando || coautor.situacao === "NA_FILA"}
                              onClick={() => enviar("em-lote", { autorIds: [coautor.id] })}
                            >
                              <Send size={16} strokeWidth={1.5} aria-hidden="true" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                          aria-label={`Excluir ${coautor.nome}`}
                          title="Excluir coautor do trabalho"
                          onClick={() => setExcluindo(coautor)}
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

      {confirmarPendentes && (
        <ModalConfirmacao
          titulo="Enviar convites pendentes"
          mensagem={`${pendentes} ${pendentes === 1 ? "coautor sem cadastro recebe" : "coautores sem cadastro recebem"} o convite por e-mail (um por endereço, mesmo que esteja em mais de um trabalho). O envio é feito aos poucos, em segundo plano — a situação na tabela atualiza sozinha.`}
          rotuloConfirmar="Enviar"
          perigo={false}
          confirmando={enviando}
          onConfirmar={() => enviar("enviar-pendentes", {}, () => setConfirmarPendentes(false))}
          onCancelar={() => setConfirmarPendentes(false)}
        />
      )}

      {editando && (
        <EditarCoautorModal
          base={base}
          coautor={editando}
          onFechar={() => setEditando(null)}
          onSalvo={async () => {
            setEditando(null);
            await recarregar();
          }}
        />
      )}

      {vinculando && (
        <VincularCoautorModal
          base={base}
          coautor={vinculando}
          onFechar={() => setVinculando(null)}
          onSalvo={async () => {
            setVinculando(null);
            await recarregar();
          }}
        />
      )}

      {excluindo && (
        <ModalConfirmacao
          titulo="Excluir coautor"
          mensagem={`${excluindo.nome} deixa de ser coautor(a) de "${excluindo.submissao.titulo}". Essa ação não pode ser desfeita.`}
          rotuloConfirmar="Excluir"
          confirmando={processando}
          onConfirmar={excluir}
          onCancelar={() => setExcluindo(null)}
        />
      )}
    </div>
  );
}

function EditarCoautorModal({ base, coautor, onFechar, onSalvo }) {
  const { notificar } = useToast();
  const [dados, setDados] = useState({ nome: coautor.nome, email: coautor.email });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");
    const resultado = atualizarCoautorSchema.safeParse(dados);
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setSalvando(true);
    try {
      const resposta = await apiClient.patch(`${base}/${coautor.id}`, resultado.data);
      notificar(
        resposta?.conviteEnfileirado ? "Coautor atualizado. O convite foi enviado ao novo e-mail." : "Coautor atualizado."
      );
      await onSalvo();
    } catch (erro) {
      setErroGeral(erro.message);
      notificar(erro.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Editar coautor" onFechar={onFechar}>
      <form onSubmit={aoSubmeter} className={styles.formulario}>
        <Alerta>{erroGeral}</Alerta>
        <p className={styles.textoApoio}>
          Se o novo e-mail já tiver conta, o trabalho é vinculado a ela; senão, o convite de cadastro é enviado ao novo
          endereço.
        </p>
        <CampoTexto
          id="coautor-nome"
          rotulo="Nome"
          value={dados.nome}
          onChange={(evento) => setDados((atual) => ({ ...atual, nome: evento.target.value }))}
          erro={erros.nome}
        />
        <CampoTexto
          id="coautor-email"
          rotulo="E-mail"
          type="email"
          value={dados.email}
          onChange={(evento) => setDados((atual) => ({ ...atual, email: evento.target.value }))}
          erro={erros.email}
        />
        <div className={styles.acoesFormulario}>
          <Botao type="button" variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" carregando={salvando}>
            Salvar
          </Botao>
        </div>
      </form>
    </Modal>
  );
}

function VincularCoautorModal({ base, coautor, onFechar, onSalvo }) {
  const { notificar } = useToast();
  const [usuario, setUsuario] = useState(null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function aoSubmeter(evento) {
    evento.preventDefault();
    if (!usuario) {
      setErro("Selecione uma conta");
      return;
    }
    setSalvando(true);
    try {
      await apiClient.patch(`${base}/${coautor.id}/vinculo`, { usuarioId: usuario.id });
      notificar(`Trabalho vinculado à conta de ${usuario.nome}.`);
      await onSalvo();
    } catch (falha) {
      notificar(falha.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Vincular a uma conta" onFechar={onFechar}>
      <form onSubmit={aoSubmeter} className={styles.formulario}>
        <p className={styles.textoApoio}>
          Para quem se cadastrou com outro e-mail. {coautor.nome} ({coautor.email}) passa a constar em &quot;
          {coautor.submissao.titulo}&quot; pela conta escolhida, e a autoria passa a usar o e-mail dela.
        </p>
        <BuscaUsuario
          id="vincular-coautor"
          rotulo="Buscar conta"
          usuarioSelecionado={usuario}
          onSelecionar={(selecionado) => {
            setUsuario(selecionado);
            setErro("");
          }}
          erro={erro}
        />
        <div className={styles.acoesFormulario}>
          <Botao type="button" variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" carregando={salvando} disabled={!usuario}>
            Vincular
          </Botao>
        </div>
      </form>
    </Modal>
  );
}
