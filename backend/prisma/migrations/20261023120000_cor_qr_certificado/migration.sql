-- Cor do QR code de validação no modelo de certificado (o fundo do QR passou
-- a ser transparente).

-- AlterTable
ALTER TABLE "modelos_certificado" ADD COLUMN "corQr" TEXT NOT NULL DEFAULT '#000000';
