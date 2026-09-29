-- CreateEnum
CREATE TYPE "OrigemCredenciamento" AS ENUM ('QR_CODE', 'EQUIPE');

-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "tokenCredenciamento" TEXT;

-- AlterTable
ALTER TABLE "atividades" ADD COLUMN     "tokenPresenca" TEXT;

-- AlterTable
ALTER TABLE "inscricoes_edicao" ADD COLUMN     "credenciadoEm" TIMESTAMP(3),
ADD COLUMN     "credenciadoPorId" TEXT,
ADD COLUMN     "credenciamentoOrigem" "OrigemCredenciamento";

-- AlterTable
ALTER TABLE "inscricoes_atividade" ADD COLUMN     "presencaEm" TIMESTAMP(3),
ADD COLUMN     "presencaOrigem" "OrigemCredenciamento",
ADD COLUMN     "presencaRegistradaPorId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "edicoes_tokenCredenciamento_key" ON "edicoes"("tokenCredenciamento");

-- CreateIndex
CREATE UNIQUE INDEX "atividades_tokenPresenca_key" ON "atividades"("tokenPresenca");

-- AddForeignKey
ALTER TABLE "inscricoes_edicao" ADD CONSTRAINT "inscricoes_edicao_credenciadoPorId_fkey" FOREIGN KEY ("credenciadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes_atividade" ADD CONSTRAINT "inscricoes_atividade_presencaRegistradaPorId_fkey" FOREIGN KEY ("presencaRegistradaPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

