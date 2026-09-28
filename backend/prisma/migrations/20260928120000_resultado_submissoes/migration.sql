-- CreateEnum
CREATE TYPE "StatusCorrecao" AS ENUM ('PENDENTE', 'ENVIADA', 'DEVOLVIDA', 'CONCLUIDA');

-- AlterEnum
ALTER TYPE "DecisaoAvaliacao" ADD VALUE 'APROVADO_FORMATACAO';

-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "prazoCorrecaoSubmissao" TIMESTAMP(3),
ADD COLUMN     "resultadoDivulgadoEm" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "submissoes" ADD COLUMN     "correcaoEnviadaEm" TIMESTAMP(3),
ADD COLUMN     "emailResultadoEnviadoEm" TIMESTAMP(3),
ADD COLUMN     "emailResultadoErro" TEXT,
ADD COLUMN     "motivoDevolucao" TEXT,
ADD COLUMN     "observacaoResultado" TEXT,
ADD COLUMN     "statusCorrecao" "StatusCorrecao";

-- CreateTable
CREATE TABLE "submissao_versoes" (
    "id" TEXT NOT NULL,
    "submissaoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "resumo" TEXT NOT NULL,
    "referenciaBibliografica" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissao_versoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modelos_email_resultado" (
    "id" TEXT NOT NULL,
    "edicaoId" TEXT NOT NULL,
    "decisao" "DecisaoAvaliacao" NOT NULL,
    "assunto" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modelos_email_resultado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "submissao_versoes_submissaoId_idx" ON "submissao_versoes"("submissaoId");

-- CreateIndex
CREATE UNIQUE INDEX "modelos_email_resultado_edicaoId_decisao_key" ON "modelos_email_resultado"("edicaoId", "decisao");

-- AddForeignKey
ALTER TABLE "submissao_versoes" ADD CONSTRAINT "submissao_versoes_submissaoId_fkey" FOREIGN KEY ("submissaoId") REFERENCES "submissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modelos_email_resultado" ADD CONSTRAINT "modelos_email_resultado_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

