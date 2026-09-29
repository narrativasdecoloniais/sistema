"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Botao from "@/components/forms/Botao";
import CardAjudaInscricao from "./CardAjudaInscricao";
import ModalConfirmacao from "./ModalConfirmacao";
import { useToast } from "./ToastProvider";
import { formatarPeriodoAtividade } from "@/lib/publico";
import {
  buscarPreviaCredenciamento,
  credenciarNoEvento,
  registrarPresencaNaAtividade,
} from "@/lib/credenciamento";
import styles from "./CredenciamentoParticipante.module.scss";

function formatarDataHora(valor) {
  return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

// Resultado da leitura de um QR code (/participante/credenciamento/<token>).
// Evento: credencia na hora. Atividade: inscrito confirmado registra na hora;
// em espera só vê o aviso; sem inscrição confirma a inscrição (e a troca, se
// houver conflito de horário) antes. As regras e janelas de horário moram no
// backend (credenciamento.service.js).
export default function LeituraCredenciamento({ token }) {
  const { notificar } = useToast();
  const [previa, setPrevia] = useState(null);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState(null); // { mensagem, espera }
  const [processando, setProcessando] = useState(false);
  const [confirmandoTroca, setConfirmandoTroca] = useState(false);
  const executouRef = useRef(false);

  async function executar(acao) {
    setProcessando(true);
    try {
      const resposta = await acao();
      const espera = resposta.status === "LISTA_ESPERA";
      setResultado({ mensagem: resposta.mensagem, espera });
      notificar(resposta.mensagem);
    } catch (falha) {
      setErro(falha.message);
      notificar(falha.message, "erro");
    } finally {
      setProcessando(false);
      setConfirmandoTroca(false);
    }
  }

  useEffect(() => {
    // Evita repetir a ação no double-render do modo de desenvolvimento.
    if (executouRef.current) return;
    executouRef.current = true;

    buscarPreviaCredenciamento(token)
      .then((dados) => {
        setPrevia(dados);
        if (!dados.janela.aberta) return;
        if (dados.tipo === "EVENTO" && !dados.credenciadoEm) {
          executar(() => credenciarNoEvento(token));
        }
        if (dados.tipo === "ATIVIDADE" && dados.inscricao?.status === "CONFIRMADA" && !dados.inscricao.presencaEm) {
          executar(() => registrarPresencaNaAtividade(token));
        }
      })
      .catch((falha) => setErro(falha.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function inscrever() {
    if (previa.conflitos.length > 0) {
      setConfirmandoTroca(true);
      return;
    }
    executar(() => registrarPresencaNaAtividade(token, { inscrever: true }));
  }

  const conteudo = () => {
    if (erro) return <p className={styles.aviso}>{erro}</p>;
    if (!previa || (processando && !resultado)) return <p className={styles.texto}>Carregando...</p>;
    if (resultado) {
      return <p className={resultado.espera ? styles.aviso : styles.sucesso}>{resultado.mensagem}</p>;
    }
    if (!previa.janela.aberta) return <p className={styles.aviso}>{previa.janela.mensagem}</p>;

    if (previa.tipo === "EVENTO") {
      return previa.credenciadoEm ? (
        <p className={styles.sucesso}>Você já está credenciado(a) no evento desde {formatarDataHora(previa.credenciadoEm)}.</p>
      ) : null;
    }

    const { inscricao, conflitos, temVaga } = previa;
    if (inscricao?.presencaEm) {
      return <p className={styles.sucesso}>Sua presença nesta atividade já foi registrada em {formatarDataHora(inscricao.presencaEm)}.</p>;
    }
    if (inscricao?.status === "LISTA_ESPERA") return <p className={styles.aviso}>Você está na lista de espera. {previa.aviso}</p>;
    if (inscricao) return null;

    const conflitoComPresenca = conflitos.find((conflito) => conflito.temPresenca);
    return (
      <>
        <p className={styles.texto}>Você não está inscrito(a) nesta atividade.</p>
        {!temVaga && (
          <p className={styles.aviso}>
            Não há mais vagas: ao se inscrever, você entra na lista de espera, e sua presença deve ser validada com a
            equipe do evento.
          </p>
        )}
        {conflitos.length > 0 && (
          <p className={styles.aviso}>
            Você está inscrito(a) em {conflitos.map((conflito) => `"${conflito.nome}"`).join(", ")} no mesmo horário.
            {conflitoComPresenca ? " Como sua presença já foi registrada lá, fale com a equipe do evento." : " Para ficar nesta, é preciso trocar de atividade."}
          </p>
        )}
        {!conflitoComPresenca && (
          <div className={styles.acoes}>
            <Botao type="button" carregando={processando} onClick={inscrever}>
              {conflitos.length > 0 ? "Trocar para esta atividade" : "Inscrever-se e registrar presença"}
            </Botao>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={styles.pagina}>
      <CardAjudaInscricao />

      <section className={styles.cartao} aria-live="polite">
        {previa?.tipo === "ATIVIDADE" ? (
          <>
            <p className={styles.eyebrow}>Presença na atividade</p>
            <h1 className={styles.titulo}>{previa.atividade.nome}</h1>
            <p className={styles.apoio}>
              {[formatarPeriodoAtividade(previa.atividade.inicioAtividade, previa.atividade.fimAtividade), previa.atividade.local]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </>
        ) : (
          <>
            <p className={styles.eyebrow}>Credenciamento no evento</p>
            <h1 className={styles.titulo}>{previa?.edicao.nome || "Credenciamento"}</h1>
          </>
        )}
        {conteudo()}
      </section>

      <Link href="/participante/credenciamento" className={styles.link}>
        ← Ler outro QR code
      </Link>

      {confirmandoTroca && (
        <ModalConfirmacao
          titulo="Trocar de atividade"
          mensagem={`Sua inscrição em ${previa.conflitos.map((conflito) => `"${conflito.nome}"`).join(", ")} será cancelada (a vaga vai para a lista de espera de lá) e você será inscrito(a) em "${previa.atividade.nome}".`}
          rotuloConfirmar="Trocar"
          perigo={false}
          confirmando={processando}
          onConfirmar={() => executar(() => registrarPresencaNaAtividade(token, { inscrever: true, trocar: true }))}
          onCancelar={() => setConfirmandoTroca(false)}
        />
      )}
    </div>
  );
}
