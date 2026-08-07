/*
  Warnings:

  - Added the required column `tipoAtividadeId` to the `atividades` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "atividades" ADD COLUMN     "tipoAtividadeId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "tipos_atividade" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_atividade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipos_atividade_nome_key" ON "tipos_atividade"("nome");

-- AddForeignKey
ALTER TABLE "atividades" ADD CONSTRAINT "atividades_tipoAtividadeId_fkey" FOREIGN KEY ("tipoAtividadeId") REFERENCES "tipos_atividade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
