-- AlterEnum
ALTER TYPE "TipoToken" ADD VALUE 'CONVITE_ORGANIZADOR';

-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "instituicao" DROP NOT NULL,
ALTER COLUMN "categoria" DROP NOT NULL,
ALTER COLUMN "aceiteTermosEm" DROP NOT NULL,
ALTER COLUMN "aceitePrivacidadeEm" DROP NOT NULL;

-- CreateTable
CREATE TABLE "organizadores_edicao" (
    "id" TEXT NOT NULL,
    "edicaoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "acessoCompleto" BOOLEAN NOT NULL DEFAULT false,
    "permissoes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizadores_edicao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizadores_edicao_edicaoId_usuarioId_key" ON "organizadores_edicao"("edicaoId", "usuarioId");

-- AddForeignKey
ALTER TABLE "organizadores_edicao" ADD CONSTRAINT "organizadores_edicao_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizadores_edicao" ADD CONSTRAINT "organizadores_edicao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
