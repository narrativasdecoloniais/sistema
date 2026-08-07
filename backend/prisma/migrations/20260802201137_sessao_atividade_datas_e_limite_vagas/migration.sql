/*
  Warnings:

  - You are about to drop the column `fimInscricoes` on the `atividade_sessoes` table. All the data in the column will be lost.
  - You are about to drop the column `inicioInscricoes` on the `atividade_sessoes` table. All the data in the column will be lost.
  - Added the required column `fimAtividade` to the `atividade_sessoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inicioAtividade` to the `atividade_sessoes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "atividade_sessoes" DROP COLUMN "fimInscricoes",
DROP COLUMN "inicioInscricoes",
ADD COLUMN     "fimAtividade" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "inicioAtividade" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "semLimiteVagas" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "vagas" DROP NOT NULL;
