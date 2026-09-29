-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "documentoEstrangeiro" TEXT,
ADD COLUMN "pais" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_documentoEstrangeiro_key" ON "usuarios"("documentoEstrangeiro");
