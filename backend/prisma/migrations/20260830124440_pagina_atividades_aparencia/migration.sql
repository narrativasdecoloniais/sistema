/*
  Warnings:

  - You are about to drop the column `corBuzioAtividade` on the `atividades` table. All the data in the column will be lost.
  - You are about to drop the column `corFundoAtividade` on the `atividades` table. All the data in the column will be lost.
  - You are about to drop the column `corTextoAtividade` on the `atividades` table. All the data in the column will be lost.
  - You are about to drop the column `mostrarFaixaAtividade` on the `atividades` table. All the data in the column will be lost.
  - You are about to drop the column `opacidadeFundoAtividade` on the `atividades` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "SecaoAdmin" ADD VALUE 'PAGINA_ATIVIDADES';

-- AlterTable
ALTER TABLE "atividades" DROP COLUMN "corBuzioAtividade",
DROP COLUMN "corFundoAtividade",
DROP COLUMN "corTextoAtividade",
DROP COLUMN "mostrarFaixaAtividade",
DROP COLUMN "opacidadeFundoAtividade";

-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "corBuzioAtividades" TEXT NOT NULL DEFAULT 'BARRO',
ADD COLUMN     "corFundoAtividades" TEXT NOT NULL DEFAULT 'PAPEL',
ADD COLUMN     "corTextoAtividades" TEXT NOT NULL DEFAULT 'TINTA',
ADD COLUMN     "mostrarFaixaAtividades" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "opacidadeFundoAtividades" INTEGER NOT NULL DEFAULT 100;
