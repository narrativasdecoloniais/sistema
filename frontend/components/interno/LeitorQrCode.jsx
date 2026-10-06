"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import Botao from "@/components/forms/Botao";
import styles from "./LeitorQrCode.module.scss";

// Leitor de QR code pela câmera do aparelho (lib qr-scanner, carregada sob
// demanda; usa o BarcodeDetector nativo quando o navegador tem). Chama
// `aoLer(texto)` na primeira leitura e desliga a câmera — ou, com `continuo`,
// a cada leitura, com a câmera sempre ligada (leitor de crachás da equipe;
// quem chama ignora repetições e leituras enquanto mostra um resultado). A
// câmera só funciona em HTTPS (ou localhost).
export default function LeitorQrCode({ aoLer, continuo = false, rotuloIniciar = "Ler QR code" }) {
  const videoRef = useRef(null);
  const leitorRef = useRef(null);
  const lidoRef = useRef(false);
  const [ativo, setAtivo] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [erro, setErro] = useState("");
  // O callback do qr-scanner é criado uma vez ao abrir a câmera; no modo
  // contínuo ele precisa sempre do `aoLer` mais recente.
  const aoLerRef = useRef(aoLer);
  aoLerRef.current = aoLer;

  function parar() {
    leitorRef.current?.stop();
    leitorRef.current?.destroy();
    leitorRef.current = null;
    setAtivo(false);
  }

  useEffect(() => parar, []);

  async function iniciar() {
    setErro("");
    lidoRef.current = false;

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setErro("Este navegador não permite usar a câmera aqui. Use a câmera do próprio celular para ler o QR code.");
      return;
    }

    setIniciando(true);
    setAtivo(true);
    try {
      const QrScanner = (await import("qr-scanner")).default;
      const leitor = new QrScanner(
        videoRef.current,
        (resultado) => {
          if (continuo) {
            aoLerRef.current(resultado.data);
            return;
          }
          if (lidoRef.current) return;
          lidoRef.current = true;
          parar();
          aoLer(resultado.data);
        },
        { preferredCamera: "environment", highlightScanRegion: true, highlightCodeOutline: true, returnDetailedScanResult: true, maxScansPerSecond: 8 }
      );
      leitorRef.current = leitor;
      await leitor.start();
    } catch (falha) {
      parar();
      const nome = falha?.name || String(falha);
      setErro(
        nome.includes("NotAllowed") || String(falha).includes("denied")
          ? "O acesso à câmera foi negado. Libere a câmera para este site nas configurações do navegador e tente de novo — ou use a câmera do próprio celular para ler o QR code."
          : nome.includes("NotFound") || String(falha).includes("Camera not found")
            ? "Nenhuma câmera foi encontrada neste aparelho."
            : "Não foi possível abrir a câmera. Tente de novo ou use a câmera do próprio celular para ler o QR code."
      );
    } finally {
      setIniciando(false);
    }
  }

  return (
    <div className={styles.leitor}>
      <div className={`${styles.visor} ${ativo ? styles.visorAtivo : ""}`}>
        {/* muted + playsInline: exigidos pelo iOS para mostrar a câmera dentro da página */}
        <video ref={videoRef} className={styles.video} muted playsInline aria-label="Imagem da câmera" />
      </div>
      {mensagemAcoes()}
      {erro && (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      )}
    </div>
  );

  function mensagemAcoes() {
    return ativo ? (
      <div className={styles.acoes}>
        <p className={styles.dica}>Aponte a câmera para o QR code.</p>
        <Botao type="button" variante="secundario" onClick={parar}>
          <X size={18} strokeWidth={1.5} aria-hidden="true" />
          Fechar câmera
        </Botao>
      </div>
    ) : (
      <div className={styles.acoes}>
        <Botao type="button" carregando={iniciando} onClick={iniciar}>
          <Camera size={18} strokeWidth={1.5} aria-hidden="true" />
          {rotuloIniciar}
        </Botao>
      </div>
    );
  }
}
