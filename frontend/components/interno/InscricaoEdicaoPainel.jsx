"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import Botao from "@/components/forms/Botao";
import CardAjudaInscricao from "./CardAjudaInscricao";
import ModalConfirmacao from "./ModalConfirmacao";
import CartaoInscricaoParticipante from "./CartaoInscricaoParticipante";
import CardContribuicaoParticipante from "./CardContribuicaoParticipante";
import CamposAdaptacao, { ADAPTACAO_VAZIA } from "./CamposAdaptacao";
import Modal from "./Modal";
import DetalhesAtividadeModal from "./DetalhesAtividadeModal";
import NavegacaoDiasParticipante, {
  idAbaDiaParticipante,
  idPainelDiaParticipante,
} from "./NavegacaoDiasParticipante";
import { useToast } from "./ToastProvider";
import { formatarPeriodoAtividade, formatarDiaAtividade } from "@/lib/publico";
import { haSobreposicao, agruparAtividadesPorDia } from "@/lib/inscricao";
import { avisoAtividade } from "@/lib/avisoAtividade";
import { adaptacaoInscricaoSchema, extrairErros } from "@/lib/validacao";
import {
  buscarInscricaoEdicao,
  salvarInscricao,
  atualizarAdaptacao,
  cancelarInscricaoAtividade,
  cancelarInscricaoGeral,
} from "@/lib/participanteInscricoes";
import styles from "./InscricaoEdicaoPainel.module.scss";

export default function InscricaoEdicaoPainel({ edicaoId, usuario }) {
  const router = useRouter();
  const { notificar } = useToast();

  const [estado, setEstado] = useState(null);
  const [erro, setErro] = useState(false);
  const [processandoGeral, setProcessandoGeral] = useState(false);
  const [processandoAtividadeId, setProcessandoAtividadeId] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const [confirmandoCarregando, setConfirmandoCarregando] = useState(false);
  const [detalheAtividade, setDetalheAtividade] = useState(null);
  const [diaAtivo, setDiaAtivo] = useState(null);
  const idDias = useId();
  // Pergunta de acessibilidade: `adaptacao` é o formulário da primeira
  // inscrição; `editandoAdaptacao` é o modal de alterar a resposta depois.
  const [adaptacao, setAdaptacao] = useState(ADAPTACAO_VAZIA);
  const [errosAdaptacao, setErrosAdaptacao] = useState({});
  const [editandoAdaptacao, setEditandoAdaptacao] = useState(null);
  const [errosEdicaoAdaptacao, setErrosEdicaoAdaptacao] = useState({});
  const [salvandoAdaptacao, setSalvandoAdaptacao] = useState(false);

  async function carregar() {
    try {
      const dados = await buscarInscricaoEdicao(edicaoId);
      setEstado(dados);
      setErro(false);
    } catch {
      setErro(true);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edicaoId]);

  async function confirmarInscricaoGeral(evento) {
    evento.preventDefault();
    const resultado = adaptacaoInscricaoSchema.safeParse(adaptacao);
    if (!resultado.success) {
      setErrosAdaptacao(extrairErros(resultado));
      return;
    }
    setErrosAdaptacao({});

    setProcessandoGeral(true);
    try {
      await salvarInscricao(edicaoId, [], resultado.data);
      notificar("Inscrição confirmada com sucesso.");
      await carregar();
      router.refresh();
    } catch (erroRequisicao) {
      notificar(erroRequisicao.message, "erro");
    } finally {
      setProcessandoGeral(false);
    }
  }

  async function inscreverEmAtividade(atividadeId) {
    setProcessandoAtividadeId(atividadeId);
    try {
      await salvarInscricao(edicaoId, [atividadeId]);
      notificar("Inscrição na atividade confirmada.");
      await carregar();
      router.refresh();
    } catch (erroRequisicao) {
      notificar(erroRequisicao.message, "erro");
    } finally {
      setProcessandoAtividadeId(null);
    }
  }

  function abrirEdicaoAdaptacao(inscricaoEdicao) {
    setErrosEdicaoAdaptacao({});
    setEditandoAdaptacao({
      precisaAdaptacao: inscricaoEdicao?.precisaAdaptacao ?? null,
      adaptacoesNecessarias: inscricaoEdicao?.adaptacoesNecessarias || "",
    });
  }

  async function salvarEdicaoAdaptacao(evento) {
    evento.preventDefault();
    const resultado = adaptacaoInscricaoSchema.safeParse(editandoAdaptacao);
    if (!resultado.success) {
      setErrosEdicaoAdaptacao(extrairErros(resultado));
      return;
    }

    setSalvandoAdaptacao(true);
    try {
      await atualizarAdaptacao(edicaoId, resultado.data);
      notificar("Resposta sobre adaptações atualizada.");
      setEditandoAdaptacao(null);
      await carregar();
    } catch (erroRequisicao) {
      notificar(erroRequisicao.message, "erro");
    } finally {
      setSalvandoAdaptacao(false);
    }
  }

  async function confirmarCancelamento() {
    if (!confirmando) return;
    setConfirmandoCarregando(true);

    try {
      if (confirmando.tipo === "atividade") {
        await cancelarInscricaoAtividade(edicaoId, confirmando.item.id);
        notificar("Inscrição na atividade cancelada.");
      } else {
        await cancelarInscricaoGeral(edicaoId);
        notificar("Inscrição cancelada.");
      }
      await carregar();
      router.refresh();
    } catch (erroRequisicao) {
      notificar(erroRequisicao.message, "erro");
    } finally {
      setConfirmandoCarregando(false);
      setConfirmando(null);
    }
  }

  if (erro) {
    return (
      <div className={styles.vazio}>
        <p>Não foi possível carregar esta inscrição.</p>
      </div>
    );
  }

  if (!estado) {
    return (
      <div className={styles.vazio}>
        <p>Carregando...</p>
      </div>
    );
  }

  const { edicao, aberta, jaInscritoNaEdicao, inscricaoAtual, atividades, apresentacoes = [] } = estado;
  const inscricoesAtividade = inscricaoAtual?.inscricoesAtividade || [];
  const inscricaoEdicao = inscricaoAtual?.inscricaoEdicao;
  const dias = agruparAtividadesPorDia(atividades || []);
  const chaveAtiva = diaAtivo && dias.some((dia) => dia.chave === diaAtivo) ? diaAtivo : (dias[0]?.chave ?? null);
  const diaAtual = dias.find((dia) => dia.chave === chaveAtiva) ?? null;

  return (
    <div className={styles.pagina}>
      <CardAjudaInscricao />

      <h1 className={styles.titulo}>{edicao.nome}</h1>

      {!aberta && (
        <div className={styles.aviso}>
          <p>As inscrições desta edição estão encerradas.</p>
        </div>
      )}

      {jaInscritoNaEdicao ? (
        <>
          <CartaoInscricaoParticipante
            edicao={edicao}
            inscricoesAtividade={inscricoesAtividade}
            apresentacoes={apresentacoes}
            nomeParticipante={usuario?.nome}
            onCancelarAtividade={
              aberta ? (item) => setConfirmando({ tipo: "atividade", item }) : undefined
            }
          />
          <section className={styles.adaptacao} aria-labelledby="titulo-adaptacao">
            <div className={styles.adaptacaoTexto}>
              <h2 id="titulo-adaptacao" className={styles.subtitulo}>
                Adaptações e recursos
              </h2>
              <p className={styles.adaptacaoResposta}>
                {inscricaoEdicao?.precisaAdaptacao === true
                  ? inscricaoEdicao.adaptacoesNecessarias
                  : inscricaoEdicao?.precisaAdaptacao === false
                    ? "Você informou que não necessita de adaptação ou recurso específico."
                    : "Você ainda não informou se necessita de alguma adaptação ou recurso específico."}
              </p>
            </div>
            <Botao type="button" variante="secundario" onClick={() => abrirEdicaoAdaptacao(inscricaoEdicao)}>
              {inscricaoEdicao?.precisaAdaptacao == null ? "Responder" : "Alterar"}
            </Botao>
          </section>
          <CardContribuicaoParticipante edicao={edicao} />
          {aberta && (
            <div className={styles.cancelarGeral}>
              <Botao type="button" variante="perigo" onClick={() => setConfirmando({ tipo: "geral" })}>
                Cancelar minha inscrição no evento
              </Botao>
            </div>
          )}
        </>
      ) : (
        aberta && (
          <form className={styles.confirmarGeral} onSubmit={confirmarInscricaoGeral} noValidate>
            <p>
              Você ainda não está inscrito(a) nesta edição. Depois de confirmar, você poderá escolher as
              atividades específicas.
            </p>
            <CamposAdaptacao
              id="adaptacao-inscricao"
              valor={adaptacao}
              onChange={setAdaptacao}
              erros={errosAdaptacao}
            />
            <div className={styles.acoesFormulario}>
              <Botao type="submit" carregando={processandoGeral}>
                Confirmar inscrição no evento
              </Botao>
            </div>
          </form>
        )
      )}

      {aberta && jaInscritoNaEdicao && dias.length > 0 && (
        <div className={styles.secaoAtividades}>
          <h2 className={styles.subtitulo}>Atividades específicas</h2>

          {dias.length > 1 ? (
            <NavegacaoDiasParticipante
              dias={dias}
              chaveAtiva={chaveAtiva}
              onSelecionar={setDiaAtivo}
              idBase={idDias}
            />
          ) : (
            diaAtual && <p className={styles.diaUnico}>{formatarDiaAtividade(diaAtual.inicioIso).completo}</p>
          )}

          {diaAtual && (
            <div
              className={styles.grade}
              {...(dias.length > 1
                ? {
                    role: "tabpanel",
                    id: idPainelDiaParticipante(idDias, diaAtual.chave),
                    "aria-labelledby": idAbaDiaParticipante(idDias, diaAtual.chave),
                  }
                : {})}
            >
              {diaAtual.atividades.map((atividade) => {
                const conflito = inscricoesAtividade.find((item) =>
                  haSobreposicao(atividade, item.atividade)
                );

                return (
                  <article key={atividade.id} className={styles.cartao}>
                    <div className={styles.cartaoCabecalho}>
                      <span className={styles.tipo}>{atividade.tipoAtividade.nome}</span>
                      <h3 className={styles.cartaoTitulo}>{atividade.nome}</h3>
                    </div>
                    <p className={styles.cartaoMeta}>
                      {formatarPeriodoAtividade(atividade.inicioAtividade, atividade.fimAtividade)}
                    </p>
                    {avisoAtividade(atividade, "INSCRICAO") && (
                      <p className={styles.cartaoDestaque}>{atividade.destaque}</p>
                    )}
                    <p className={styles.cartaoMeta}>
                      {atividade.semLimiteVagas
                        ? "Sem limite de vagas"
                        : atividade.lotada
                          ? "Lotada (lista de espera)"
                          : `${atividade.vagasRestantes} vaga(s)`}
                    </p>
                    <div className={styles.cartaoAcoes}>
                      <button
                        type="button"
                        className={styles.detalhes}
                        onClick={() => setDetalheAtividade(atividade)}
                      >
                        Ver detalhes <span aria-hidden="true">→</span>
                      </button>
                      {conflito ? (
                        <span className={styles.conflito}>
                          Conflita com &quot;{conflito.atividade.nome}&quot;
                        </span>
                      ) : (
                        <Botao
                          type="button"
                          variante="secundario"
                          carregando={processandoAtividadeId === atividade.id}
                          onClick={() => inscreverEmAtividade(atividade.id)}
                        >
                          Inscrever-se
                        </Botao>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {detalheAtividade && (
        <DetalhesAtividadeModal atividade={detalheAtividade} onFechar={() => setDetalheAtividade(null)} />
      )}

      {editandoAdaptacao && (
        <Modal titulo="Adaptações e recursos" onFechar={() => setEditandoAdaptacao(null)}>
          <form className={styles.formularioModal} onSubmit={salvarEdicaoAdaptacao} noValidate>
            <CamposAdaptacao
              id="adaptacao-edicao"
              valor={editandoAdaptacao}
              onChange={setEditandoAdaptacao}
              erros={errosEdicaoAdaptacao}
            />
            <div className={styles.acoesFormulario}>
              <Botao type="button" variante="secundario" onClick={() => setEditandoAdaptacao(null)}>
                Cancelar
              </Botao>
              <Botao type="submit" carregando={salvandoAdaptacao}>
                Salvar
              </Botao>
            </div>
          </form>
        </Modal>
      )}

      {confirmando && (
        <ModalConfirmacao
          titulo={confirmando.tipo === "atividade" ? "Cancelar inscrição na atividade" : "Cancelar inscrição"}
          mensagem={
            confirmando.tipo === "atividade"
              ? `Cancelar sua inscrição em "${confirmando.item.atividade.nome}"?`
              : "Cancelar sua inscrição neste evento também cancela suas inscrições em todas as atividades específicas dele. Essa ação não pode ser desfeita."
          }
          rotuloConfirmar="Cancelar inscrição"
          confirmando={confirmandoCarregando}
          onConfirmar={confirmarCancelamento}
          onCancelar={() => setConfirmando(null)}
        />
      )}
    </div>
  );
}
