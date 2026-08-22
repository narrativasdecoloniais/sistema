-- AlterEnum
ALTER TYPE "SecaoAdmin" ADD VALUE 'PROGRAMAS_POS_GRADUACAO';

-- CreateTable
CREATE TABLE "programas_pos_graduacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "imagem" TEXT,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programas_pos_graduacao_pkey" PRIMARY KEY ("id")
);
