"use client";

import ConteudoRichText from "@/components/ConteudoRichText";
import { PAGINA_CERTIFICADO } from "@/lib/certificados";
import styles from "./PreviaCertificado.module.scss";

// Prévia aproximada do certificado, atualizada a cada ajuste: mesma geometria
// do gerador de PDF (backend/src/services/pdfCertificado.service.js) — mm e
// pt convertidos em cqw, já que a página ocupa 100% da largura do container.
// A fonte do navegador não é idêntica à do PDF; "Pré-visualizar PDF" mostra o
// resultado exato.

const PT_POR_MM = 72 / 25.4;
const LARGURA_PT = PAGINA_CERTIFICADO.largura * PT_POR_MM;
const TAMANHO_ROTULO_QR = 7;

const cqwDeMm = (mm) => `${(mm / PAGINA_CERTIFICADO.largura) * 100}cqw`;
const cqwDePt = (pt) => `${(pt / LARGURA_PT) * 100}cqw`;

const FAMILIAS = {
  ARCHIVO: "var(--font-archivo), Archivo, sans-serif",
  TIMES: '"Times New Roman", Times, serif',
  HELVETICA: "Helvetica, Arial, sans-serif",
};

const ALINHAMENTOS = { ESQUERDA: "left", CENTRO: "center", DIREITA: "right", JUSTIFICADO: "justify" };

function escapar(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function preencherMarcadores(html, valores) {
  return String(html || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (original, chave) =>
    Object.prototype.hasOwnProperty.call(valores, chave) ? escapar(valores[chave]) : original
  );
}

export default function PreviaCertificado({ modelo, valores, aoCarregarFundo }) {
  const direita = modelo.posicaoQr.endsWith("DIREITO");
  const inferior = modelo.posicaoQr.startsWith("INFERIOR");

  return (
    <div className={styles.moldura}>
      <div className={styles.pagina} aria-label="Prévia do certificado" role="img">
        {modelo.imagemFundo && (
          <img
            src={modelo.imagemFundo}
            alt=""
            className={styles.fundo}
            onLoad={(evento) =>
              aoCarregarFundo?.({ largura: evento.target.naturalWidth, altura: evento.target.naturalHeight })
            }
          />
        )}

        <div
          className={styles.caixa}
          style={{
            top: cqwDeMm(modelo.margemSuperior),
            bottom: cqwDeMm(modelo.margemInferior),
            left: cqwDeMm(modelo.margemEsquerda),
            right: cqwDeMm(modelo.margemDireita),
            justifyContent: modelo.alinhamentoVertical === "CENTRO" ? "center" : "flex-start",
          }}
        >
          <div
            style={{
              fontFamily: FAMILIAS[modelo.fonte],
              fontSize: cqwDePt(modelo.tamanhoFonte),
              lineHeight: modelo.entrelinha,
              color: modelo.corTexto,
              textAlign: ALINHAMENTOS[modelo.alinhamento],
            }}
          >
            <ConteudoRichText
              html={preencherMarcadores(modelo.texto, valores)}
              tipo="certificado"
              className={styles.texto}
            />
          </div>
        </div>

        <div
          className={`${styles.qr} ${direita ? styles.qrDireita : ""}`}
          style={{
            [direita ? "right" : "left"]: cqwDeMm(modelo.margemQr),
            [inferior ? "bottom" : "top"]: cqwDeMm(modelo.margemQr),
            "--tamanho-qr": cqwDeMm(modelo.tamanhoQr),
            "--tamanho-rotulo": cqwDePt(TAMANHO_ROTULO_QR),
          }}
          aria-hidden="true"
        >
          <span className={styles.qrCodigo}>QR</span>
          <span className={styles.qrRotulo}>
            Código de validação
            <strong>{valores.codigo}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
