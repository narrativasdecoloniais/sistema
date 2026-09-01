"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Botao from "@/components/forms/Botao";
import ModalConfirmacao from "./ModalConfirmacao";
import CartaoInscricaoParticipante from "./CartaoInscricaoParticipante";
import { useToast } from "./ToastProvider";
import { formatarPeriodoAtividade } from "@/lib/publico";
import { haSobreposicao } from "@/lib/inscricao";
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
  const atividadesOrdenadas = [...(atividades || [])].sort(
    (a, b) => new Date(a.inicioAtividade) - new Date(b.inicioAtividade)
  );

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

      {aberta && atividadesOrdenadas.length > 0 && (
        <div className={styles.secaoAtividades}>
          <h2 className={styles.subtitulo}>Atividades específicas</h2>
          <div className={styles.tabelaWrapper}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Atividade</th>
                  <th>Período</th>
                  <th>Vagas</th>
                  <th className={styles.colunaAcoes}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {atividadesOrdenadas.map((atividade) => {
                  const conflito = inscricoesAtividade.find((item) =>
                    haSobreposicao(atividade, item.atividade)
                  );

                  return (
                    <tr key={atividade.id}>
                      <td data-rotulo="Atividade">{atividade.nome}</td>
                      <td data-rotulo="Período">
                        {formatarPeriodoAtividade(atividade.inicioAtividade, atividade.fimAtividade)}
                      </td>
                      <td data-rotulo="Vagas">
                        {atividade.semLimiteVagas
                          ? "Sem limite"
                          : atividade.lotada
                            ? "Lotada (lista de espera)"
                            : `${atividade.vagasRestantes} vaga(s)`}
                      </td>
                      <td data-rotulo="Ação" className={styles.colunaAcoes}>
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
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
