-- CreateEnum
CREATE TYPE "StatusInscricaoAtividade" AS ENUM ('CONFIRMADA', 'LISTA_ESPERA');

-- CreateTable
CREATE TABLE "inscricoes_edicao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "edicaoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inscricoes_edicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscricoes_atividade" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "atividadeId" TEXT NOT NULL,
    "status" "StatusInscricaoAtividade" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscricoes_atividade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inscricoes_edicao_usuarioId_edicaoId_key" ON "inscricoes_edicao"("usuarioId", "edicaoId");

-- CreateIndex
CREATE INDEX "inscricoes_atividade_atividadeId_status_idx" ON "inscricoes_atividade"("atividadeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "inscricoes_atividade_usuarioId_atividadeId_key" ON "inscricoes_atividade"("usuarioId", "atividadeId");

-- AddForeignKey
ALTER TABLE "inscricoes_edicao" ADD CONSTRAINT "inscricoes_edicao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes_edicao" ADD CONSTRAINT "inscricoes_edicao_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes_atividade" ADD CONSTRAINT "inscricoes_atividade_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes_atividade" ADD CONSTRAINT "inscricoes_atividade_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "atividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
