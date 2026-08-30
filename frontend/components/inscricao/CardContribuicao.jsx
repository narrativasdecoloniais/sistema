"use client";

import { useToast } from "@/components/publico/ToastProvider";
import styles from "./CardContribuicao.module.scss";

// Mensagem de contribuição voluntária (ex. pedido de PIX) mostrada na etapa
// final da inscrição — conteúdo gerenciado pelo admin por edição, ver
// ContribuicaoForm.jsx (editor rico) e sanitizarCorpoContribuicao.js
// (sanitização no backend antes de salvar — corpoContribuicao já chega
// aqui como HTML seguro, por isso o dangerouslySetInnerHTML). Só renderiza
// quando há corpo cadastrado; link e "copiar" são mutuamente exclusivos
// (tipoAcaoContribuicao).
export default function CardContribuicao({ edicao }) {
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
    <div className={styles.cartao}>
      {tituloContribuicao && <p className={styles.titulo}>{tituloContribuicao}</p>}

      <div className={styles.corpo} dangerouslySetInnerHTML={{ __html: corpoContribuicao }} />

      {tipoAcaoContribuicao === "LINK" && linkContribuicaoUrl && (
        <a href={linkContribuicaoUrl} target="_blank" rel="noopener noreferrer" className={styles.acao}>
          {linkContribuicaoRotulo || "Saiba mais"} <span aria-hidden="true">→</span>
        </a>
      )}

      {tipoAcaoContribuicao === "COPIAR" && copiaContribuicaoValor && (
        <div className={styles.blocoCopiar}>
          {copiaContribuicaoRotulo && <span className={styles.rotuloCopiar}>{copiaContribuicaoRotulo}</span>}
          <div className={styles.linhaCopiar}>
            <code className={styles.valorCopiar}>{copiaContribuicaoValor}</code>
            <button type="button" className={styles.botaoCopiar} onClick={aoCopiar}>
              Clique para copiar a chave Pix
            </button>
          </div>
          {qrCodeContribuicao && (
            <img src={qrCodeContribuicao} alt="QR code para pagamento via PIX" className={styles.qrCode} />
          )}
        </div>
      )}
    </div>
  );
}
