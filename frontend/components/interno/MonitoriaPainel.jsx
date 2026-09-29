"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, RefreshCw } from "lucide-react";
import Botao from "@/components/forms/Botao";
import ModalConfirmacao from "./ModalConfirmacao";
import CartoesContadores from "./CartoesContadores";
import MonitoriaInscricoesTabela from "./MonitoriaInscricoesTabela";
import MonitoriaConfiguracaoForm from "./MonitoriaConfiguracaoForm";
import { useToast } from "./ToastProvider";
import { listarMonitoria, divulgarResultadoMonitoria, reenviarEmailsMonitoria } from "@/lib/monitoria";
import { formatarPeriodoEdicao } from "@/lib/publico";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./MonitoriaPainel.module.scss";

const INTERVALO_ATUALIZACAO_MS = 5000;

// Tela da Coordenação de Monitoria (seção MONITORIA): inscrições com a
// seleção, divulgação do resultado (e-mails em segundo plano) e as
// configurações da chamada (período, vagas, funções e edital).
export default function MonitoriaPainel({ edicaoId, dadosIniciais }) {
  const router = useRouter();
  const { notificar } = useToast();
  const [dados, setDados] = useState(dadosIniciais);
  const [abaAtiva, setAbaAtiva] = useState("inscricoes");
  const [confirmando, setConfirmando] = useState(null); // "divulgar" | "reenviar"
  const [processando, setProcessando] = useState(false);

  const recarregar = useCallback(async () => {
    setDados(await listarMonitoria(edicaoId));
    router.refresh();
  }, [edicaoId, router]);

  const enviando = Boolean(dados?.estado.enviando);
  useEffect(() => {
    if (!enviando) return undefined;
    const temporizador = setInterval(() => recarregar().catch(() => {}), INTERVALO_ATUALIZACAO_MS);
    return () => clearInterval(temporizador);
  }, [enviando, recarregar]);

  if (!dados) {
    return (
      <div className={styles.vazio}>
        <p>Não foi possível carregar a monitoria.</p>
        <p className={styles.vazioApoio}>Recarregue a página para tentar de novo.</p>
      </div>
    );
  }

  const { edicao, inscricoes, estado } = dados;
  const divulgado = Boolean(edicao.resultadoMonitoriaDivulgadoEm);
  const contar = (status) => inscricoes.filter((inscricao) => inscricao.status === status).length;
  const emAnalise = contar("EM_ANALISE");
  const selecionados = contar("SELECIONADO");

  async function executarConfirmacao() {
    setProcessando(true);
    try {
      const resposta =
        confirmando === "divulgar"
          ? await divulgarResultadoMonitoria(edicaoId)
          : await reenviarEmailsMonitoria(edicaoId);
      notificar(resposta.mensagem);
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessando(false);
      setConfirmando(null);
    }
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Monitoria</h1>
          <p className={styles.descricao}>
            Inscrições de monitoras e monitores, seleção pela Coordenação de Monitoria e divulgação do resultado.
          </p>
        </div>
      </div>

      <section className={estilos.painelEstado} aria-label="Situação da chamada">
        <div className={estilos.estadoTexto}>
          <p className={estilos.semMargem}>
            <strong>Inscrições {edicao.aberta ? "abertas" : "fechadas"}</strong>
            {edicao.inicioInscricoesMonitoria && edicao.fimInscricoesMonitoria
              ? ` — ${formatarPeriodoEdicao(edicao.inicioInscricoesMonitoria, edicao.fimInscricoesMonitoria)}`
              : " — defina o período na aba Configurações."}
          </p>
          <p className={styles.textoApoio} aria-live="polite">
            {divulgado ? (
              <>
                Resultado divulgado em {new Date(edicao.resultadoMonitoriaDivulgadoEm).toLocaleDateString("pt-BR")}. E-mails:{" "}
                {estado.emailsPendentes} {estado.emailsPendentes === 1 ? "pendente" : "pendentes"}
                {estado.emailsComErro > 0 && ` (${estado.emailsComErro} com erro)`}
                {estado.enviando && " · enviando..."}
              </>
            ) : emAnalise > 0 ? (
              `Resultado ainda não divulgado — ${emAnalise} ${emAnalise === 1 ? "inscrição" : "inscrições"} em análise.`
            ) : (
              "Resultado ainda não divulgado."
            )}
          </p>
          {divulgado && (
            <p className={styles.textoApoio}>
              Mudanças de situação feitas agora (ex. chamar alguém da lista de espera) ficam com o e-mail pendente
              até você reenviar.
            </p>
          )}
        </div>
        <div className={estilos.estadoAcoes}>
          {divulgado ? (
            <Botao
              type="button"
              onClick={() => setConfirmando("reenviar")}
              disabled={estado.emailsPendentes === 0 || estado.enviando}
            >
              <RefreshCw size={18} strokeWidth={1.5} aria-hidden="true" />
              Enviar e-mails pendentes ({estado.emailsPendentes})
            </Botao>
          ) : (
            <Botao
              type="button"
              onClick={() => setConfirmando("divulgar")}
              disabled={inscricoes.length === 0}
              title={emAnalise > 0 ? "Defina a situação de todas as inscrições antes de divulgar" : undefined}
            >
              <Megaphone size={18} strokeWidth={1.5} aria-hidden="true" />
              Divulgar resultado
            </Botao>
          )}
        </div>
      </section>

      <CartoesContadores
        itens={[
          { rotulo: "Inscrições", valor: inscricoes.filter((inscricao) => inscricao.status !== "CANCELADA").length },
          {
            rotulo: edicao.vagasMonitoria ? `Selecionados (de ${edicao.vagasMonitoria} vagas)` : "Selecionados",
            valor: selecionados,
          },
          { rotulo: "Lista de espera", valor: contar("LISTA_ESPERA") },
          { rotulo: "Em análise", valor: emAnalise },
          { rotulo: "Canceladas", valor: contar("CANCELADA") },
        ]}
      />

      <div className={styles.abas} role="tablist" aria-label="Seções da monitoria">
        {[
          { chave: "inscricoes", rotulo: "Inscrições" },
          { chave: "configuracoes", rotulo: "Configurações" },
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

      {abaAtiva === "inscricoes" ? (
        <MonitoriaInscricoesTabela
          edicaoId={edicaoId}
          edicao={edicao}
          inscricoes={inscricoes}
          recarregar={recarregar}
        />
      ) : (
        <MonitoriaConfiguracaoForm edicaoId={edicaoId} edicao={edicao} aoSalvar={recarregar} />
      )}

      {confirmando && (
        <ModalConfirmacao
          titulo={confirmando === "divulgar" ? "Divulgar resultado" : "Enviar e-mails pendentes"}
          mensagem={
            confirmando === "divulgar"
              ? "Cada candidato(a) passa a ver a própria situação na área do participante e recebe um e-mail com o resultado (selecionado, lista de espera com a posição ou não selecionado). A divulgação acontece uma única vez; mudanças depois disso geram um novo e-mail só para quem mudou."
              : `${estado.emailsPendentes} ${estado.emailsPendentes === 1 ? "candidato(a) recebe" : "candidatos(as) recebem"} o e-mail com a situação atual.`
          }
          rotuloConfirmar={confirmando === "divulgar" ? "Divulgar" : "Enviar"}
          perigo={false}
          confirmando={processando}
          onConfirmar={executarConfirmacao}
          onCancelar={() => setConfirmando(null)}
        />
      )}
    </div>
  );
}
