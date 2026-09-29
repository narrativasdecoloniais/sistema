"use client";

import Botao from "@/components/forms/Botao";
import ConteudoRichText from "@/components/ConteudoRichText";
import { useToast } from "./ToastProvider";
import styles from "./CardContribuicaoParticipante.module.scss";

// Mensagem de contribuição voluntária (ex. pedido de PIX) mostrada a quem já
// está inscrito na edição — conteúdo gerenciado pelo admin por edição, ver
// ContribuicaoForm.jsx (editor rico) e sanitizarCorpoContribuicao.js
// (sanitização no backend antes de salvar, e de novo no navegador via
// ConteudoRichText). Só renderiza quando há corpo cadastrado; link e "copiar"
// são mutuamente exclusivos (tipoAcaoContribuicao).
export default function CardContribuicaoParticipante({ edicao }) {
  const { notificar } = useToast();

  // Checagem robusta pra "sem conteúdo real" — não basta a string existir,
  // porque o editor rico pode salvar algo como "<p></p>"/"<p><br></p>" sem
  // nenhum texto visível (ver isEmpty espelhado em CampoRichText.jsx).
  const temConteudo = Boolean(edicao?.corpoContribuicao?.replace(/<[^>]*>/g, "").trim());
  if (!temConteudo) return null;

  const {
    tituloContribuicao,
    corpoContribuicao,
    tipoAcaoContribuicao,
    linkContribuicaoUrl,
    linkContribuicaoRotulo,
    copiaContribuicaoValor,
    copiaContribuicaoRotulo,
    qrCodeContribuicao,
  } = edicao;

  async function aoCopiar() {
    try {
      await navigator.clipboard.writeText(copiaContribuicaoValor);
      notificar(`${copiaContribuicaoRotulo || "Valor"} copiado.`);
    } catch {
      notificar("Não foi possível copiar. Copie o valor manualmente.", "erro");
    }
  }

  return (
    <section className={styles.cartao} aria-label={tituloContribuicao || "Contribuição"}>
      {tituloContribuicao && <h2 className={styles.titulo}>{tituloContribuicao}</h2>}

      <ConteudoRichText className={styles.corpo} html={corpoContribuicao} tipo="texto" />

      {tipoAcaoContribuicao === "LINK" && linkContribuicaoUrl && (
        <a href={linkContribuicaoUrl} target="_blank" rel="noopener noreferrer" className={styles.acao}>
          {linkContribuicaoRotulo || "Saiba mais"} <span aria-hidden="true">→</span>
        </a>
      )}

      {tipoAcaoContribuicao === "COPIAR" && copiaContribuicaoValor && (
        <div className={styles.blocoCopiar}>
          {copiaContribuicaoRotulo && <span className={styles.rotuloCopiar}>{copiaContribuicaoRotulo}</span>}
          <Botao type="button" variante="secundario" onClick={aoCopiar}>
            Clique para copiar a chave Pix
          </Botao>
          {qrCodeContribuicao && (
            <img src={qrCodeContribuicao} alt="QR code para pagamento via PIX" className={styles.qrCode} />
          )}
        </div>
      )}
    </section>
  );
}
