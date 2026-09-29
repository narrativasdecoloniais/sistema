-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "apresentacaoPublicadaEm" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "submissoes" ADD COLUMN     "atividadeApresentacaoId" TEXT,
ADD COLUMN     "emailApresentacaoAtividadeId" TEXT,
ADD COLUMN     "emailApresentacaoEnviadoEm" TIMESTAMP(3),
ADD COLUMN     "emailApresentacaoErro" TEXT,
ADD COLUMN     "ordemApresentacao" INTEGER;

-- CreateIndex
CREATE INDEX "submissoes_atividadeApresentacaoId_idx" ON "submissoes"("atividadeApresentacaoId");

-- AddForeignKey
ALTER TABLE "submissoes" ADD CONSTRAINT "submissoes_atividadeApresentacaoId_fkey" FOREIGN KEY ("atividadeApresentacaoId") REFERENCES "atividades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

