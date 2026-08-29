-- CreateEnum
CREATE TYPE "TipoPontoInteresse" AS ENUM ('LOCAL_EVENTO', 'HOSPEDAGEM', 'RESTAURANTE', 'OUTRO');

-- AlterEnum
ALTER TYPE "SecaoAdmin" ADD VALUE 'PAGINA_LOCALIZACAO';

-- CreateTable
CREATE TABLE "edicao_pontos_interesse" (
    "id" TEXT NOT NULL,
    "edicaoId" TEXT NOT NULL,
    "tipo" "TipoPontoInteresse" NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edicao_pontos_interesse_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "edicao_pontos_interesse" ADD CONSTRAINT "edicao_pontos_interesse_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
