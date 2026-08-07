/*
  Warnings:

  - You are about to drop the `organizadores_edicao` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "organizadores_edicao" DROP CONSTRAINT "organizadores_edicao_edicaoId_fkey";

-- DropForeignKey
ALTER TABLE "organizadores_edicao" DROP CONSTRAINT "organizadores_edicao_usuarioId_fkey";

-- DropTable
DROP TABLE "organizadores_edicao";
