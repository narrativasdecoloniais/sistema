-- Certificados de atuação em atividade (convidados: palestrantes, mediadores...)
-- e de equipe do evento, com e-mail/conta dessas pessoas, e envio dos
-- certificados por e-mail.

-- AlterEnum


ALTER TYPE "TipoCertificado" ADD VALUE 'ATUACAO_ATIVIDADE';
ALTER TYPE "TipoCertificado" ADD VALUE 'EQUIPE_EVENTO';

-- AlterTable
ALTER TABLE "atividade_pessoas" ADD COLUMN     "email" TEXT,
ADD COLUMN     "usuarioId" TEXT;

-- AlterTable
ALTER TABLE "certificados" ADD COLUMN     "atividadePessoaId" TEXT,
ADD COLUMN     "emailEnviadoEm" TIMESTAMP(3),
ADD COLUMN     "emailErro" TEXT,
ADD COLUMN     "emailSolicitadoEm" TIMESTAMP(3),
ADD COLUMN     "membroEquipeId" TEXT;

-- CreateTable
CREATE TABLE "membros_equipe" (
    "id" TEXT NOT NULL,
    "edicaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "usuarioId" TEXT,
    "funcao" TEXT NOT NULL,
    "cargaHoraria" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membros_equipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "membros_equipe_edicaoId_idx" ON "membros_equipe"("edicaoId");

-- CreateIndex
CREATE INDEX "membros_equipe_usuarioId_idx" ON "membros_equipe"("usuarioId");

-- CreateIndex
CREATE INDEX "atividade_pessoas_usuarioId_idx" ON "atividade_pessoas"("usuarioId");

-- CreateIndex
CREATE INDEX "certificados_atividadePessoaId_idx" ON "certificados"("atividadePessoaId");

-- CreateIndex
CREATE INDEX "certificados_membroEquipeId_idx" ON "certificados"("membroEquipeId");

-- AddForeignKey
ALTER TABLE "atividade_pessoas" ADD CONSTRAINT "atividade_pessoas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_equipe" ADD CONSTRAINT "membros_equipe_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_equipe" ADD CONSTRAINT "membros_equipe_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_atividadePessoaId_fkey" FOREIGN KEY ("atividadePessoaId") REFERENCES "atividade_pessoas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_membroEquipeId_fkey" FOREIGN KEY ("membroEquipeId") REFERENCES "membros_equipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

