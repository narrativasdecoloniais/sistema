-- CreateEnum
CREATE TYPE "TipoCertificado" AS ENUM ('PARTICIPACAO_EVENTO', 'PRESENCA_ATIVIDADE', 'APRESENTACAO_TRABALHO', 'AVALIADOR', 'MONITOR');

-- CreateEnum
CREATE TYPE "OrigemCertificado" AS ENUM ('REGRA', 'MANUAL');

-- CreateEnum
CREATE TYPE "PosicaoQrCertificado" AS ENUM ('INFERIOR_DIREITO', 'INFERIOR_ESQUERDO', 'SUPERIOR_DIREITO', 'SUPERIOR_ESQUERDO');

-- CreateEnum
CREATE TYPE "AlinhamentoCertificado" AS ENUM ('ESQUERDA', 'CENTRO', 'DIREITA', 'JUSTIFICADO');

-- CreateEnum
CREATE TYPE "AlinhamentoVerticalCertificado" AS ENUM ('TOPO', 'CENTRO');

-- CreateEnum
CREATE TYPE "FonteCertificado" AS ENUM ('ARCHIVO', 'TIMES', 'HELVETICA');

-- CreateTable
CREATE TABLE "modelos_certificado" (
    "id" TEXT NOT NULL,
    "edicaoId" TEXT NOT NULL,
    "tipo" "TipoCertificado" NOT NULL,
    "imagemFundo" TEXT,
    "larguraFundo" INTEGER,
    "alturaFundo" INTEGER,
    "texto" TEXT NOT NULL,
    "margemSuperior" DOUBLE PRECISION NOT NULL,
    "margemInferior" DOUBLE PRECISION NOT NULL,
    "margemEsquerda" DOUBLE PRECISION NOT NULL,
    "margemDireita" DOUBLE PRECISION NOT NULL,
    "alinhamento" "AlinhamentoCertificado" NOT NULL DEFAULT 'CENTRO',
    "alinhamentoVertical" "AlinhamentoVerticalCertificado" NOT NULL DEFAULT 'CENTRO',
    "fonte" "FonteCertificado" NOT NULL DEFAULT 'ARCHIVO',
    "tamanhoFonte" DOUBLE PRECISION NOT NULL DEFAULT 16,
    "entrelinha" DOUBLE PRECISION NOT NULL DEFAULT 1.4,
    "corTexto" TEXT NOT NULL DEFAULT '#2B2622',
    "posicaoQr" "PosicaoQrCertificado" NOT NULL DEFAULT 'INFERIOR_DIREITO',
    "tamanhoQr" DOUBLE PRECISION NOT NULL DEFAULT 24,
    "margemQr" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "cargaHoraria" INTEGER,
    "liberadoEm" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modelos_certificado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificados" (
    "id" TEXT NOT NULL,
    "edicaoId" TEXT NOT NULL,
    "tipo" "TipoCertificado" NOT NULL,
    "chave" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "usuarioId" TEXT,
    "submissaoAutorId" TEXT,
    "atividadeId" TEXT,
    "origem" "OrigemCertificado" NOT NULL DEFAULT 'REGRA',
    "dados" JSONB NOT NULL,
    "revogadoEm" TIMESTAMP(3),
    "motivoRevogacao" TEXT,
    "emitidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "modelos_certificado_edicaoId_tipo_key" ON "modelos_certificado"("edicaoId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "certificados_codigo_key" ON "certificados"("codigo");

-- CreateIndex
CREATE INDEX "certificados_usuarioId_idx" ON "certificados"("usuarioId");

-- CreateIndex
CREATE INDEX "certificados_submissaoAutorId_idx" ON "certificados"("submissaoAutorId");

-- CreateIndex
CREATE UNIQUE INDEX "certificados_edicaoId_tipo_chave_key" ON "certificados"("edicaoId", "tipo", "chave");

-- AddForeignKey
ALTER TABLE "modelos_certificado" ADD CONSTRAINT "modelos_certificado_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_submissaoAutorId_fkey" FOREIGN KEY ("submissaoAutorId") REFERENCES "submissao_autores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "atividades"("id") ON DELETE SET NULL ON UPDATE CASCADE;
