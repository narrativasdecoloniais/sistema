"use client";

import ConteudoRichText from "@/components/ConteudoRichText";
import { TAMANHO_CODIGO_QR_PT, faixaCodigoQr } from "@/lib/certificados";
import styles from "./PreviaCertificado.module.scss";

// Prévia aproximada do certificado, atualizada a cada ajuste: mesma geometria
// do gerador de PDF (backend/src/services/pdfCertificado.service.js) — mm e
// pt convertidos em cqw, já que a página ocupa 100% da largura do container.
// A fonte do navegador não é idêntica à do PDF; "Pré-visualizar PDF" mostra o
// resultado exato.

const PT_POR_MM = 72 / 25.4;

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

// pagina = paginaCertificado(tipo) de lib/certificados.js (paisagem ou retrato).
export default function PreviaCertificado({ modelo, valores, pagina, aoCarregarFundo }) {
  const faixaCodigo = faixaCodigoQr(modelo, pagina);
  const cqwDeMm = (mm) => `${(mm / pagina.largura) * 100}cqw`;
  const cqwDePt = (pt) => `${(pt / (pagina.largura * PT_POR_MM)) * 100}cqw`;

  return (
    <div className={`${styles.moldura} ${pagina.retrato ? styles.molduraRetrato : ""}`}>
      <div
        className={styles.pagina}
        style={{ aspectRatio: `${pagina.largura} / ${pagina.altura}` }}
        aria-label="Prévia do documento"
        role="img"
      >
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

        {/* Mesma geometria do PDF: QR no ponto escolhido e o código numa faixa
            logo abaixo (faixaCodigoQr), 2 pt depois do QR. */}
        <div
          className={styles.qrArea}
          style={{
            "--tamanho-rotulo": cqwDePt(TAMANHO_CODIGO_QR_PT),
            "--cor-qr": modelo.corQr || "#000000",
          }}
          aria-hidden="true"
        >
          <span
            className={styles.qrCodigo}
            style={{
              left: cqwDeMm(modelo.esquerdaQr),
              top: cqwDeMm(modelo.topoQr),
              "--tamanho-qr": cqwDeMm(modelo.tamanhoQr),
            }}
          >
            QR
          </span>
          <span
            className={styles.qrRotulo}
            style={{
              left: cqwDeMm(faixaCodigo.esquerda),
              top: `calc(${cqwDeMm(modelo.topoQr + modelo.tamanhoQr)} + ${cqwDePt(2)})`,
              width: cqwDeMm(faixaCodigo.largura),
              textAlign: ALINHAMENTOS[modelo.alinhamentoCodigoQr] || "center",
            }}
          >
            Código de validação
            <strong>{valores.codigo}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
