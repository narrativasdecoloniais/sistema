/*
  Warnings:

  - You are about to drop the `atividade_sessoes` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `fimAtividade` to the `atividades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inicioAtividade` to the `atividades` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "atividade_sessoes" DROP CONSTRAINT "atividade_sessoes_atividadeId_fkey";

-- AlterTable
ALTER TABLE "atividades" ADD COLUMN     "exigeInscricao" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "fimAtividade" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "inicioAtividade" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "semLimiteVagas" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vagas" INTEGER;

-- DropTable
DROP TABLE "atividade_sessoes";
