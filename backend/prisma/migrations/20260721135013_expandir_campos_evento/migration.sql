-- CreateEnum
CREATE TYPE "ModalidadeEdicao" AS ENUM ('ONLINE', 'PRESENCIAL', 'HIBRIDO');

-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "cargaHorariaTotal" INTEGER,
ADD COLUMN     "cidade" TEXT,
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "fusoHorario" TEXT DEFAULT 'America/Sao_Paulo',
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "linksExtras" JSONB,
ADD COLUMN     "local" TEXT,
ADD COLUMN     "modalidade" "ModalidadeEdicao",
ADD COLUMN     "notificarAlteracoes" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pais" TEXT,
ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "edicoes_slug_key" ON "edicoes"("slug");
