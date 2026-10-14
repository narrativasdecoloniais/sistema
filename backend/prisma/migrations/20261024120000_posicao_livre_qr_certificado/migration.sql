-- QR code do certificado em posição livre (distância da esquerda e do topo,
-- em mm) no lugar de "canto + distância das bordas". Converte os modelos já
-- salvos para a mesma posição de antes: página A4 paisagem (297 × 210 mm),
-- retrato (210 × 297) na carta de aceite; o rótulo "Código de validação"
-- embaixo do QR ocupava ~6,42 mm (7 pt × 2,6).

-- AlterTable
ALTER TABLE "modelos_certificado"
  ADD COLUMN "esquerdaQr" DOUBLE PRECISION,
  ADD COLUMN "topoQr" DOUBLE PRECISION,
  ADD COLUMN "alinhamentoCodigoQr" "AlinhamentoCertificado" NOT NULL DEFAULT 'CENTRO';

UPDATE "modelos_certificado"
SET
  "esquerdaQr" = ROUND((CASE
    WHEN "posicaoQr" IN ('INFERIOR_DIREITO', 'SUPERIOR_DIREITO')
      THEN (CASE WHEN "tipo" = 'CARTA_ACEITE' THEN 210 ELSE 297 END) - "margemQr" - "tamanhoQr"
    ELSE "margemQr"
  END)::numeric, 1)::double precision,
  "topoQr" = ROUND((CASE
    WHEN "posicaoQr" IN ('INFERIOR_DIREITO', 'INFERIOR_ESQUERDO')
      THEN (CASE WHEN "tipo" = 'CARTA_ACEITE' THEN 297 ELSE 210 END) - "margemQr" - "tamanhoQr" - 6.42
    ELSE "margemQr"
  END)::numeric, 1)::double precision,
  "alinhamentoCodigoQr" = (CASE
    WHEN "posicaoQr" IN ('INFERIOR_DIREITO', 'SUPERIOR_DIREITO') THEN 'DIREITA'
    ELSE 'ESQUERDA'
  END)::"AlinhamentoCertificado";

ALTER TABLE "modelos_certificado"
  ALTER COLUMN "esquerdaQr" SET NOT NULL,
  ALTER COLUMN "topoQr" SET NOT NULL,
  DROP COLUMN "posicaoQr",
  DROP COLUMN "margemQr";

-- DropEnum
DROP TYPE "PosicaoQrCertificado";
