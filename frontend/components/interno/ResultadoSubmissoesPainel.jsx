"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import Botao from "@/components/forms/Botao";
import ModalConfirmacao from "./ModalConfirmacao";
import CampoTexto from "./CampoTexto";
import CartoesContadores from "./CartoesContadores";
import AbaTrabalhosResultado from "./ResultadoTrabalhos";
import AbaModelosEmail from "./ResultadoModelosEmail";
import EnviarEmailsResultadoModal from "./EnviarEmailsResultadoModal";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { paraData } from "@/lib/dataHoraIngenua";
import { formatarPrazoCorrecao } from "@/lib/avaliacoes";
// Tabelas, abas, modais e estados vazios são os mesmos da tela de Avaliação.
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilosResultado from "./ResultadoSubmissoesPainel.module.scss";

const INTERVALO_ATUALIZACAO_MS = 5000;

function formatarDataHora(valor) {
  return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function ResultadoSubmissoesPainel({
  edicaoId,
  resumoInicial,
  trabalhosIniciais,
  modelosIniciais,
  marcadores,
  modalidades,
}) {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState("divulgacao");
  const [resumo, setResumo] = useState(resumoInicial);
  const [trabalhos, setTrabalhos] = useState(trabalhosIniciais);

  const recarregar = useCallback(async () => {
    const base = `/edicoes/${edicaoId}/resultado`;
    const [dadosResumo, dadosTrabalhos] = await Promise.all([apiClient.get(base), apiClient.get(`${base}/trabalhos`)]);
    setResumo(dadosResumo?.resumo || null);
    setTrabalhos(dadosTrabalhos?.trabalhos || []);
    router.refresh();
  }, [edicaoId, router]);

  // Enquanto o envio em segundo plano roda, atualiza o progresso sozinho.
  const enviando = Boolean(resumo?.emails.enviando);
  useEffect(() => {
    if (!enviando) return undefined;
    const temporizador = setInterval(() => {
      recarregar().catch(() => {});
    }, INTERVALO_ATUALIZACAO_MS);
    return () => clearInterval(temporizador);
  }, [enviando, recarregar]);

  const aguardandoConferencia = resumo?.correcoes?.ENVIADA || 0;
  const abas = [
    { chave: "divulgacao", rotulo: "Divulgação" },
    { chave: "trabalhos", rotulo: aguardandoConferencia ? `Trabalhos (${aguardandoConferencia})` : "Trabalhos" },
    { chave: "emails", rotulo: "Textos dos e-mails" },
  ];

  if (!resumo) {
    return (
      <div className={styles.vazio}>
        <p>Não foi possível carregar o resultado desta edição.</p>
        <p className={styles.vazioApoio}>Recarregue a página para tentar de novo.</p>
      </div>
    );
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Resultado das submissões</h1>
          <p className={styles.descricao}>
            Divulgue as decisões finais aos autores, acompanhe as correções pedidas e ajuste os textos dos e-mails.
          </p>
        </div>
      </div>

      <div className={styles.abas} role="tablist" aria-label="Seções do resultado">
        {abas.map((aba) => (
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

      {abaAtiva === "divulgacao" && (
        <AbaDivulgacao edicaoId={edicaoId} resumo={resumo} recarregar={recarregar} />
      )}
      {abaAtiva === "trabalhos" && (
        <AbaTrabalhosResultado
          edicaoId={edicaoId}
          trabalhos={trabalhos}
          modalidades={modalidades}
          divulgado={Boolean(resumo.divulgadoEm)}
          recarregar={recarregar}
        />
      )}
      {abaAtiva === "emails" && (
        <AbaModelosEmail edicaoId={edicaoId} modelosIniciais={modelosIniciais} marcadores={marcadores} />
      )}
    </div>
  );
}

function AbaDivulgacao({ edicaoId, resumo, recarregar }) {
  const { notificar } = useToast();
  const [prazo, setPrazo] = useState(paraData(resumo.prazoCorrecao));
  const [salvandoPrazo, setSalvandoPrazo] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [divulgando, setDivulgando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  // null = fechado; senão a etapa em que o modal de e-mails abre.
  const [modalEmails, setModalEmails] = useState(null);

  const fecharModalEmails = useCallback(() => {
    setModalEmails(null);
    // Textos salvos no modal valem também na aba "Textos dos e-mails".
    recarregar().catch(() => {});
  }, [recarregar]);

  const divulgado = Boolean(resumo.divulgadoEm);
  const { decisoes, emails } = resumo;

  const pendencias = [];
  if (resumo.total === 0) pendencias.push("Nenhum trabalho foi submetido nesta edição.");
  if (resumo.semDecisao > 0) {
    pendencias.push(
      `${resumo.semDecisao} ${resumo.semDecisao === 1 ? "trabalho está" : "trabalhos estão"} sem decisão final.`
    );
  }
  if (resumo.comCorrecao > 0 && !resumo.prazoCorrecaoAberto) {
    pendencias.push("Defina um prazo de correção futuro — há trabalhos que exigem correção do autor.");
  }

  async function salvarPrazo() {
    setSalvandoPrazo(true);
    try {
      await apiClient.patch(`/edicoes/${edicaoId}/resultado/prazo`, { prazo: prazo || null });
      notificar(prazo ? "Prazo de correção salvo." : "Prazo de correção removido.");
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvandoPrazo(false);
    }
  }

  async function divulgar() {
    setDivulgando(true);
    try {
      const resposta = await apiClient.post(`/edicoes/${edicaoId}/resultado/divulgar`, {});
      notificar(resposta.mensagem);
      setConfirmando(false);
      setModalEmails("pergunta");
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
      setConfirmando(false);
    } finally {
      setDivulgando(false);
    }
  }

  async function reenviar() {
    setReenviando(true);
    try {
      const resposta = await apiClient.post(`/edicoes/${edicaoId}/resultado/enviar-emails`, {});
      notificar(resposta.mensagem);
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setReenviando(false);
    }
  }

  const prazoAlterado = paraData(resumo.prazoCorrecao) !== prazo;

  return (
    <>
      <CartoesContadores
        itens={[
          { rotulo: "Trabalhos", valor: resumo.total },
          { rotulo: "Aprovados", valor: decisoes.APROVADO || 0, tom: "sucesso" },
          { rotulo: "Aprovados com ressalvas", valor: decisoes.APROVADO_COM_RESSALVAS || 0 },
          { rotulo: "Pendentes de revisão", valor: decisoes.APROVADO_FORMATACAO || 0 },
          { rotulo: "Reprovados", valor: decisoes.REPROVADO || 0 },
          { rotulo: "Sem decisão final", valor: resumo.semDecisao, tom: resumo.semDecisao ? "alerta" : undefined },
        ]}
      />

      <section className={estilosResultado.bloco} aria-labelledby="titulo-prazo-correcao">
        <h2 id="titulo-prazo-correcao" className={styles.rotuloBloco}>
          Prazo de correção
        </h2>
        <p className={styles.textoApoio}>
          Vale para os trabalhos aprovados com ressalvas e os pendentes de revisão. O dia escolhido conta
          inteiro. Pode ser estendido depois da divulgação.
        </p>
        <div className={styles.linhaAcao}>
          <CampoTexto
            id="prazoCorrecao"
            rotulo="Enviar correções até"
            type="date"
            value={prazo}
            onChange={(evento) => setPrazo(evento.target.value)}
          />
          <Botao
            type="button"
            variante="secundario"
            onClick={salvarPrazo}
            carregando={salvandoPrazo}
            disabled={!prazoAlterado}
          >
            Salvar prazo
          </Botao>
        </div>
      </section>

      <section className={estilosResultado.bloco} aria-labelledby="titulo-divulgacao">
        <h2 id="titulo-divulgacao" className={styles.rotuloBloco}>
          Divulgação
        </h2>

        {!divulgado ? (
          <>
            {pendencias.length > 0 ? (
              <div className={styles.aviso}>
                <p className={estilosResultado.semMargem}>Antes de divulgar:</p>
                <ul className={estilosResultado.listaPendencias}>
                  {pendencias.map((pendencia) => (
                    <li key={pendencia}>{pendencia}</li>
                  ))}
                </ul>
                {resumo.semDecisao > 0 && (
                  <Link href={`/admin/edicoes/${edicaoId}/submissoes/avaliacao`} className={estilosResultado.link}>
                    Ir para a Avaliação
                  </Link>
                )}
              </div>
            ) : (
              <p className={styles.textoApoio}>
                Tudo pronto. Ao divulgar, o resultado aparece em Minhas submissões e os aprovados entram na lista
                pública. Nenhum e-mail é enviado automaticamente — em seguida você escolhe se quer avisar os autores,
                revisando os textos antes.
              </p>
            )}
            <div>
              <Botao type="button" onClick={() => setConfirmando(true)} disabled={pendencias.length > 0}>
                <Send size={18} strokeWidth={1.5} aria-hidden="true" />
                Divulgar resultado
              </Botao>
            </div>
          </>
        ) : (
          <>
            <p className={estilosResultado.semMargem}>
              Resultado divulgado em <strong>{formatarDataHora(resumo.divulgadoEm)}</strong>.
              {resumo.prazoCorrecao && ` Correções até ${formatarPrazoCorrecao(resumo.prazoCorrecao)}.`}
            </p>
            {emails.total > 0 && (
              <>
                <div className={estilosResultado.progresso}>
                  <p className={estilosResultado.semMargem} aria-live="polite">
                    E-mails: {emails.enviados} de {emails.total} {emails.total === 1 ? "trabalho enviado" : "trabalhos enviados"}
                    {emails.comErro > 0 && ` · ${emails.comErro} com erro`}
                    {emails.enviando && " · enviando..."}
                  </p>
                  <div
                    className={estilosResultado.barra}
                    role="progressbar"
                    aria-label="Progresso do envio dos e-mails"
                    aria-valuemin={0}
                    aria-valuemax={emails.total}
                    aria-valuenow={emails.enviados}
                  >
                    <span style={{ width: `${(emails.enviados / emails.total) * 100}%` }} />
                  </div>
                </div>
                {emails.pendentes > 0 && !emails.enviando && (
                  <div>
                    <Botao type="button" variante="secundario" onClick={reenviar} carregando={reenviando}>
                      Reenviar pendentes ({emails.pendentes})
                    </Botao>
                  </div>
                )}
              </>
            )}
            {emails.naoSolicitados > 0 && (
              <>
                <p className={styles.textoApoio}>
                  {emails.total === 0
                    ? "Nenhum e-mail de resultado foi enviado aos autores."
                    : `${emails.naoSolicitados} ${emails.naoSolicitados === 1 ? "trabalho ainda não recebeu" : "trabalhos ainda não receberam"} o e-mail de resultado.`}
                  {emails.enviando && " Aguarde o envio em andamento terminar para enviar outros grupos."}
                </p>
                <div>
                  <Botao
                    type="button"
                    variante="secundario"
                    onClick={() => setModalEmails("revisao")}
                    disabled={emails.enviando}
                  >
                    <Send size={18} strokeWidth={1.5} aria-hidden="true" />
                    Enviar e-mails aos autores
                  </Botao>
                </div>
              </>
            )}
            <p className={styles.textoApoio}>
              As decisões ficam travadas depois da divulgação. Acompanhe e confira as correções na aba “Trabalhos”.
            </p>
          </>
        )}
      </section>

      {confirmando && (
        <ModalConfirmacao
          titulo="Divulgar resultado"
          mensagem={`O resultado de ${resumo.total} ${resumo.total === 1 ? "trabalho" : "trabalhos"} será divulgado e as decisões ficarão travadas. Nenhum e-mail é enviado agora. Essa ação não pode ser desfeita.`}
          rotuloConfirmar="Divulgar"
          perigo={false}
          confirmando={divulgando}
          onConfirmar={divulgar}
          onCancelar={() => setConfirmando(false)}
        />
      )}

      {modalEmails && (
        <EnviarEmailsResultadoModal
          edicaoId={edicaoId}
          etapaInicial={modalEmails}
          onFechar={fecharModalEmails}
          onEnviado={fecharModalEmails}
        />
      )}
    </>
  );
}
