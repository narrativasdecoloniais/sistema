-- AlterTable
ALTER TABLE "atividades" ADD COLUMN     "cargaHoraria" INTEGER,
ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "local" TEXT;

-- CreateTable
CREATE TABLE "atividade_pessoas" (
    "id" TEXT NOT NULL,
    "atividadeId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "imagem" TEXT,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atividade_pessoas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "atividade_pessoas" ADD CONSTRAINT "atividade_pessoas_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "atividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
