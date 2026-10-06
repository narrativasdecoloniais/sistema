"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleCheck, RefreshCw } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Avatar from "./Avatar";
import ModalConfirmacao from "./ModalConfirmacao";
import { useToast } from "./ToastProvider";
import { buscarMeuCracha, gerarNovoCracha, gerarQrDataUrl } from "@/lib/credenciamento";
import styles from "./CrachaParticipante.module.scss";

// Enquanto a pessoa não está credenciada, a tela consulta a situação de tempos
// em tempos — assim que a equipe lê o crachá, aparece "Credenciado(a)".
const INTERVALO_ATUALIZACAO = 5000;

function formatarDataHora(valor) {
  return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

// Crachá virtual: QR code próprio da pessoa (só o token), lido pela equipe no
// leitor de crachás para credenciar no evento ou registrar presença numa
// atividade (credenciamento.service.js).
export default function CrachaParticipante() {
  const { notificar } = useToast();
  const [cracha, setCracha] = useState(null);
  const [imagem, setImagem] = useState(null);
  const [erro, setErro] = useState("");
  const [confirmandoNovo, setConfirmandoNovo] = useState(false);
  const [gerando, setGerando] = useState(false);
  const tokenRef = useRef(null);

  async function aplicar(dados) {
    // A URL da foto é assinada de novo a cada consulta; mantém a primeira
    // para a imagem não recarregar a cada atualização.
    setCracha((atual) => (atual?.token === dados.token ? { ...dados, pessoa: atual.pessoa } : dados));
    if (dados.token !== tokenRef.current) {
      tokenRef.current = dados.token;
      setImagem(await gerarQrDataUrl(dados.token, 560));
    }
  }

  useEffect(() => {
    buscarMeuCracha()
      .then(aplicar)
      .catch((falha) => setErro(falha.message));
  }, []);

  const credenciado = Boolean(cracha?.credenciadoEm);
  useEffect(() => {
    if (!cracha || credenciado) return undefined;
    const intervalo = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      buscarMeuCracha()
        .then(aplicar)
        .catch(() => {});
    }, INTERVALO_ATUALIZACAO);
    return () => clearInterval(intervalo);
  }, [cracha, credenciado]);

  async function confirmarNovo() {
    setGerando(true);
    try {
      const resposta = await gerarNovoCracha();
      await aplicar(resposta);
      notificar(resposta.mensagem);
    } catch (falha) {
      notificar(falha.message, "erro");
    } finally {
      setGerando(false);
      setConfirmandoNovo(false);
    }
  }

  return (
    <div className={styles.pagina}>
      <div>
        <h1 className={styles.titulo}>Meu crachá</h1>
        <p className={styles.descricao}>
          Mostre este QR code para a equipe na entrada do evento e na porta das atividades com inscrição.
        </p>
      </div>

      {erro ? (
        <p className={styles.aviso} role="alert">
          {erro}
        </p>
      ) : !cracha ? (
        <p className={styles.apoio}>Carregando...</p>
      ) : (
        <>
          <section className={styles.cracha} aria-label="Crachá virtual">
            {cracha.edicao && <p className={styles.eyebrow}>{cracha.edicao.nome}</p>}
            <div className={styles.pessoa}>
              <Avatar usuario={cracha.pessoa} tamanho={56} />
              <div className={styles.pessoaTexto}>
                <p className={styles.nome}>{cracha.pessoa.nome}</p>
                {cracha.pessoa.documento && <p className={styles.apoio}>{cracha.pessoa.documento}</p>}
              </div>
            </div>
            <div className={styles.qr}>
              {imagem ? <img src={imagem} alt="QR code do seu crachá" /> : <span>Gerando QR code...</span>}
            </div>
            <p className={credenciado ? styles.situacaoOk : styles.situacao} aria-live="polite">
              {credenciado ? (
                <>
                  <CircleCheck size={18} strokeWidth={1.5} aria-hidden="true" />
                  Credenciado(a) em {formatarDataHora(cracha.credenciadoEm)}
                </>
              ) : (
                "Ainda não credenciado(a) nesta edição"
              )}
            </p>
          </section>

          <p className={styles.apoio}>
            Sem internet no evento? Faça um print desta tela — o crachá funciona do mesmo jeito. Se preferir, você
            mesmo(a) pode ler o QR code afixado na entrada em <Link href="/participante/credenciamento">Credenciamento</Link>.
          </p>

          <div>
            <Botao type="button" variante="secundario" onClick={() => setConfirmandoNovo(true)}>
              <RefreshCw size={18} strokeWidth={1.5} aria-hidden="true" />
              Gerar novo crachá
            </Botao>
          </div>
        </>
      )}

      {confirmandoNovo && (
        <ModalConfirmacao
          titulo="Gerar novo crachá"
          mensagem="O QR code atual (e qualquer print ou foto dele) deixa de funcionar. Use se alguém tiver uma cópia do seu crachá."
          rotuloConfirmar="Gerar novo"
          confirmando={gerando}
          onConfirmar={confirmarNovo}
          onCancelar={() => setConfirmandoNovo(false)}
        />
      )}
    </div>
  );
}
