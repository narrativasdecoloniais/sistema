"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Botao from "@/components/forms/Botao";
import ModalConfirmacao from "./ModalConfirmacao";
import CardAjudaInscricao from "./CardAjudaInscricao";
import FormularioMonitoria from "./FormularioMonitoria";
import { useToast } from "./ToastProvider";
import { formatarPeriodoEdicao } from "@/lib/publico";
import {
  ROTULOS_STATUS_MONITORIA,
  buscarMinhaInscricaoMonitoria,
  cancelarInscricaoMonitoria,
  salvarInscricaoMonitoria,
} from "@/lib/monitoria";
import styles from "./MonitoriaParticipantePainel.module.scss";

function mensagemStatus(inscricao) {
  switch (inscricao.status) {
    case "SELECIONADO":
      return "Você foi selecionado(a) para a monitoria! A Coordenação de Monitoria vai entrar em contato com as orientações sobre a formação e as atividades.";
    case "LISTA_ESPERA":
      return `Você está na lista de espera${
        inscricao.posicaoListaEspera ? `, na posição ${inscricao.posicaoListaEspera}` : ""
      }. Caso surjam vagas, a Coordenação de Monitoria entra em contato seguindo a ordem da lista.`;
    case "NAO_SELECIONADO":
      return "Desta vez não foi possível selecionar a sua inscrição. Agradecemos muito o seu interesse.";
    case "CANCELADA":
      return "Esta inscrição foi cancelada.";
    default:
      return "Inscrição recebida. O resultado será divulgado aqui e por e-mail.";
  }
}

// Inscrição do participante logado na monitoria de uma edição: formulário,
// situação (a decisão só aparece depois da divulgação), edição enquanto a
// janela estiver aberta e desistência (edital, item 8.1.1).
export default function MonitoriaParticipantePainel({ edicaoId, usuario }) {
  const router = useRouter();
  const { notificar } = useToast();
  const [estado, setEstado] = useState(null);
  const [erro, setErro] = useState(false);
  const [editando, setEditando] = useState(false);
  const [confirmandoDesistencia, setConfirmandoDesistencia] = useState(false);
  const [desistindo, setDesistindo] = useState(false);

  async function carregar() {
    try {
      setEstado(await buscarMinhaInscricaoMonitoria(edicaoId));
      setErro(false);
    } catch {
      setErro(true);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edicaoId]);

  async function enviar(dados) {
    try {
      const resposta = await salvarInscricaoMonitoria(edicaoId, dados);
      const eraNova = !estado.inscricao || estado.inscricao.status === "CANCELADA";
      notificar(eraNova ? "Inscrição na monitoria enviada." : "Inscrição atualizada.");
      setEstado((atual) => ({ ...atual, inscricao: resposta.inscricao }));
      setEditando(false);
      router.refresh();
    } catch (erroRequisicao) {
      notificar(erroRequisicao.message, "erro");
    }
  }

  async function desistir() {
    setDesistindo(true);
    try {
      const resposta = await cancelarInscricaoMonitoria(edicaoId);
      notificar("Inscrição na monitoria cancelada.");
      setEstado((atual) => ({ ...atual, inscricao: resposta.inscricao }));
      router.refresh();
    } catch (erroRequisicao) {
      notificar(erroRequisicao.message, "erro");
    } finally {
      setDesistindo(false);
      setConfirmandoDesistencia(false);
    }
  }

  if (erro) {
    return (
      <div className={styles.vazio}>
        <p>Não foi possível carregar a monitoria desta edição.</p>
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

  const { edicao, aberta, inscricao } = estado;
  const podeEditar = aberta && !edicao.resultadoDivulgado;
  const periodo =
    edicao.inicioInscricoesMonitoria && edicao.fimInscricoesMonitoria
      ? formatarPeriodoEdicao(edicao.inicioInscricoesMonitoria, edicao.fimInscricoesMonitoria)
      : null;
  const mostrarFormulario = podeEditar && (!inscricao || editando);

  return (
    <div className={styles.pagina}>
      <CardAjudaInscricao />

      <div>
        <h1 className={styles.titulo}>Monitoria — {edicao.nome}</h1>
        <p className={styles.descricao}>
          Monitoria voluntária do evento.{periodo ? ` Inscrições: ${periodo}.` : ""}
        </p>
      </div>

      {inscricao && !editando && (
        <section className={styles.cartao} aria-labelledby="situacao-monitoria">
          <div className={styles.cartaoCabecalho}>
            <h2 id="situacao-monitoria" className={styles.subtitulo}>
              Sua inscrição
            </h2>
            <span className={styles.tag}>{ROTULOS_STATUS_MONITORIA[inscricao.status]}</span>
          </div>
          <p className={styles.mensagem}>{mensagemStatus(inscricao)}</p>
          <p className={styles.apoio}>Atividades de interesse: {inscricao.funcoes.join("; ")}.</p>
          <div className={styles.acoes}>
            {podeEditar && (
              <Botao type="button" variante="secundario" onClick={() => setEditando(true)}>
                {inscricao.status === "CANCELADA" ? "Inscrever-se novamente" : "Editar inscrição"}
              </Botao>
            )}
            {!["CANCELADA", "NAO_SELECIONADO"].includes(inscricao.status) && (
              <Botao type="button" variante="perigo" onClick={() => setConfirmandoDesistencia(true)}>
                Desistir da monitoria
              </Botao>
            )}
          </div>
        </section>
      )}

      {!inscricao && !aberta && (
        <div className={styles.vazio}>
          <p>As inscrições para a monitoria não estão abertas.</p>
          {periodo && <p className={styles.apoio}>Período de inscrição: {periodo}.</p>}
        </div>
      )}

      {!inscricao && aberta && edicao.funcoesMonitoria.length === 0 && (
        <div className={styles.vazio}>
          <p>A inscrição ainda está sendo preparada pela organização. Volte em breve.</p>
        </div>
      )}

      {mostrarFormulario && edicao.funcoesMonitoria.length > 0 && (
        <FormularioMonitoria
          key={inscricao?.id || "nova"}
          edicao={edicao}
          usuario={usuario}
          inscricao={inscricao}
          aoEnviar={enviar}
          aoCancelar={inscricao ? () => setEditando(false) : undefined}
        />
      )}

      {confirmandoDesistencia && (
        <ModalConfirmacao
          titulo="Desistir da monitoria"
          mensagem={
            podeEditar
              ? "Sua inscrição será cancelada. Enquanto as inscrições estiverem abertas, você pode se inscrever de novo."
              : "Sua inscrição será cancelada e a Coordenação de Monitoria poderá chamar outra pessoa. Essa ação não pode ser desfeita por aqui."
          }
          rotuloConfirmar="Desistir"
          confirmando={desistindo}
          onConfirmar={desistir}
          onCancelar={() => setConfirmandoDesistencia(false)}
        />
      )}
    </div>
  );
}
