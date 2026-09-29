"use client";

import { useEffect, useState } from "react";
import { Download, Printer, RefreshCw } from "lucide-react";
import Botao from "@/components/forms/Botao";
import ModalConfirmacao from "./ModalConfirmacao";
import { useToast } from "./ToastProvider";
import { baixarQrPng, gerarQrDataUrl, imprimirQrCodes } from "@/lib/credenciamento";
import estilos from "./CredenciamentoPainel.module.scss";

// QR code de credenciamento (evento) ou de presença (atividade): mostra,
// baixa em PNG, imprime em A4 e gera um novo (invalida o impresso).
// `carregar`/`gerarNovo` devolvem { url, titulo, subtitulo, atividade? }.
export default function CartaoQrCode({ titulo, descricao, evento, nomeArquivo, carregar, gerarNovo }) {
  const { notificar } = useToast();
  const [qr, setQr] = useState(null);
  const [imagem, setImagem] = useState(null);
  const [erro, setErro] = useState("");
  const [confirmandoNovo, setConfirmandoNovo] = useState(false);
  const [gerando, setGerando] = useState(false);

  async function exibir(dados) {
    setQr(dados);
    setImagem(await gerarQrDataUrl(dados.url, 480));
  }

  useEffect(() => {
    carregar()
      .then(exibir)
      .catch((falha) => setErro(falha.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function baixar() {
    try {
      await baixarQrPng(qr, nomeArquivo);
    } catch (falha) {
      notificar(falha.message, "erro");
    }
  }

  async function imprimir() {
    try {
      await imprimirQrCodes([qr], { evento });
    } catch (falha) {
      notificar(falha.message, "erro");
    }
  }

  async function confirmarNovo() {
    setGerando(true);
    try {
      const resposta = await gerarNovo();
      await exibir(resposta);
      notificar(resposta.mensagem);
    } catch (falha) {
      notificar(falha.message, "erro");
    } finally {
      setGerando(false);
      setConfirmandoNovo(false);
    }
  }

  return (
    <section className={estilos.cartaoQr} aria-label={titulo}>
      <div className={estilos.qrImagem}>
        {imagem ? <img src={imagem} alt={`QR code — ${titulo}`} /> : <span>{erro || "Gerando QR code..."}</span>}
      </div>
      <div className={estilos.qrTexto}>
        <h2 className={estilos.qrTitulo}>{titulo}</h2>
        {descricao && <p className={estilos.qrDescricao}>{descricao}</p>}
        <div className={estilos.qrAcoes}>
          <Botao type="button" variante="secundario" onClick={baixar} disabled={!qr}>
            <Download size={18} strokeWidth={1.5} aria-hidden="true" />
            Baixar PNG
          </Botao>
          <Botao type="button" variante="secundario" onClick={imprimir} disabled={!qr}>
            <Printer size={18} strokeWidth={1.5} aria-hidden="true" />
            Imprimir
          </Botao>
          <Botao type="button" variante="secundario" onClick={() => setConfirmandoNovo(true)} disabled={!qr}>
            <RefreshCw size={18} strokeWidth={1.5} aria-hidden="true" />
            Gerar novo QR
          </Botao>
        </div>
      </div>

      {confirmandoNovo && (
        <ModalConfirmacao
          titulo="Gerar novo QR code"
          mensagem="O QR code atual (inclusive o já impresso) deixa de funcionar. Use só se ele vazou ou foi fotografado e compartilhado fora do evento."
          rotuloConfirmar="Gerar novo"
          confirmando={gerando}
          onConfirmar={confirmarNovo}
          onCancelar={() => setConfirmandoNovo(false)}
        />
      )}
    </section>
  );
}
