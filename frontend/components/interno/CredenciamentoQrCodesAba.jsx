"use client";

import { Printer } from "lucide-react";
import Botao from "@/components/forms/Botao";
import CartaoQrCode from "./CartaoQrCode";
import { useToast } from "./ToastProvider";
import { credenciamentoAdmin, imprimirQrCodes } from "@/lib/credenciamento";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./CredenciamentoPainel.module.scss";

// Preparação do evento: os cartazes de autocredenciamento (o participante lê
// o QR afixado, em vez de mostrar o crachá à equipe).
export default function CredenciamentoQrCodesAba({ edicaoId, edicao, temAtividades }) {
  const { notificar } = useToast();

  async function imprimirAtividades() {
    try {
      await imprimirQrCodes(async () => (await credenciamentoAdmin.qrTodasAtividades(edicaoId)).qrs, { evento: edicao.nome });
    } catch (erro) {
      notificar(erro.message, "erro");
    }
  }

  return (
    <>
      <CartaoQrCode
        titulo="QR code do credenciamento no evento"
        descricao={`Afixe na entrada. Cada pessoa lê em Credenciamento, na área do participante (ou com a câmera do celular); quem ainda não tem inscrição é inscrito na hora. Funciona só nos dias do evento, no horário de Brasília${
          edicao.janela.aberta ? " — aberto agora." : `: ${edicao.janela.mensagem}`
        }`}
        evento={edicao.nome}
        nomeArquivo="qr-credenciamento-evento"
        carregar={() => credenciamentoAdmin.qrEvento(edicaoId)}
        gerarNovo={() => credenciamentoAdmin.novoQrEvento(edicaoId)}
      />

      {temAtividades && (
        <section className={estilos.secaoQr} aria-labelledby="qr-atividades">
          <h2 id="qr-atividades" className={estilos.subtitulo}>
            QR codes das atividades
          </h2>
          <p className={styles.textoApoio}>
            Um cartaz por atividade com inscrição, válido de 30 minutos antes do início até o fim. O QR de cada uma,
            para baixar ou gerar de novo, fica na lista de presença dela, em Atividades.
          </p>
          <div>
            <Botao type="button" variante="secundario" onClick={imprimirAtividades}>
              <Printer size={18} strokeWidth={1.5} aria-hidden="true" />
              Imprimir QR de todas as atividades
            </Botao>
          </div>
        </section>
      )}
    </>
  );
}
