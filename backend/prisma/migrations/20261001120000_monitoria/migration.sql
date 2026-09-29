-- CreateEnum
CREATE TYPE "StatusInscricaoMonitoria" AS ENUM ('EM_ANALISE', 'SELECIONADO', 'LISTA_ESPERA', 'NAO_SELECIONADO', 'CANCELADA');

-- AlterEnum
ALTER TYPE "SecaoAdmin" ADD VALUE 'MONITORIA';

-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "editalMonitoria" TEXT,
ADD COLUMN     "fimInscricoesMonitoria" TIMESTAMP(3),
ADD COLUMN     "funcoesMonitoria" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "inicioInscricoesMonitoria" TIMESTAMP(3),
ADD COLUMN     "resultadoMonitoriaDivulgadoEm" TIMESTAMP(3),
ADD COLUMN     "vagasMonitoria" INTEGER;

-- CreateTable
CREATE TABLE "inscricoes_monitoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "edicaoId" TEXT NOT NULL,
    "dataNascimento" DATE NOT NULL,
    "pronome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "cursoInstituicao" TEXT NOT NULL,
    "experienciaAnterior" BOOLEAN NOT NULL,
    "funcoes" TEXT[],
    "precisaAdaptacao" BOOLEAN NOT NULL,
    "adaptacoesNecessarias" TEXT,
    "cienteEm" TIMESTAMP(3) NOT NULL,
    "autorizacaoResponsavel" TEXT,
    "status" "StatusInscricaoMonitoria" NOT NULL DEFAULT 'EM_ANALISE',
    "posicaoListaEspera" INTEGER,
    "observacaoCoordenacao" TEXT,
    "emailResultadoEnviadoEm" TIMESTAMP(3),
    "emailResultadoErro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscricoes_monitoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inscricoes_monitoria_edicaoId_status_idx" ON "inscricoes_monitoria"("edicaoId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "inscricoes_monitoria_usuarioId_edicaoId_key" ON "inscricoes_monitoria"("usuarioId", "edicaoId");

-- AddForeignKey
ALTER TABLE "inscricoes_monitoria" ADD CONSTRAINT "inscricoes_monitoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes_monitoria" ADD CONSTRAINT "inscricoes_monitoria_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

