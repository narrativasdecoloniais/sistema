"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import Botao from "@/components/forms/Botao";
import ModalConfirmacao from "./ModalConfirmacao";
import CartaoInscricaoParticipante from "./CartaoInscricaoParticipante";
import DetalhesAtividadeModal from "./DetalhesAtividadeModal";
import NavegacaoDiasParticipante, {
  idAbaDiaParticipante,
  idPainelDiaParticipante,
} from "./NavegacaoDiasParticipante";
import { useToast } from "./ToastProvider";
import { formatarPeriodoAtividade, formatarDiaAtividade } from "@/lib/publico";
import { haSobreposicao, agruparAtividadesPorDia } from "@/lib/inscricao";
import {
  buscarInscricaoEdicao,
  salvarInscricao,
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

  async function confirmarInscricaoGeral() {
    setProcessandoGeral(true);
    try {
      await salvarInscricao(edicaoId, []);
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

  const { edicao, aberta, jaInscritoNaEdicao, inscricaoAtual, atividades } = estado;
  const inscricoesAtividade = inscricaoAtual?.inscricoesAtividade || [];
  const dias = agruparAtividadesPorDia(atividades || []);
  const chaveAtiva = diaAtivo && dias.some((dia) => dia.chave === diaAtivo) ? diaAtivo : (dias[0]?.chave ?? null);
  const diaAtual = dias.find((dia) => dia.chave === chaveAtiva) ?? null;

  return (
    <div className={styles.pagina}>
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
            nomeParticipante={usuario?.nome}
            onCancelarAtividade={
              aberta ? (item) => setConfirmando({ tipo: "atividade", item }) : undefined
            }
          />
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
          <div className={styles.confirmarGeral}>
            <p>Você ainda não está inscrito(a) nesta edição.</p>
            <Botao type="button" carregando={processandoGeral} onClick={confirmarInscricaoGeral}>
              Confirmar inscrição no evento
            </Botao>
          </div>
        )
      )}

      {aberta && dias.length > 0 && (
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
