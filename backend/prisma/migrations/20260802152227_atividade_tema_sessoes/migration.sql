/*
  Warnings:

  - You are about to drop the column `fimInscricoes` on the `atividades` table. All the data in the column will be lost.
  - You are about to drop the column `inicioInscricoes` on the `atividades` table. All the data in the column will be lost.
  - You are about to drop the column `vagas` on the `atividades` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "atividades" DROP COLUMN "fimInscricoes",
DROP COLUMN "inicioInscricoes",
DROP COLUMN "vagas",
ADD COLUMN     "tema" TEXT;

-- CreateTable
CREATE TABLE "atividade_sessoes" (
    "id" TEXT NOT NULL,
    "atividadeId" TEXT NOT NULL,
    "vagas" INTEGER NOT NULL,
    "inicioInscricoes" TIMESTAMP(3) NOT NULL,
    "fimInscricoes" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atividade_sessoes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "atividade_sessoes" ADD CONSTRAINT "atividade_sessoes_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "atividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
