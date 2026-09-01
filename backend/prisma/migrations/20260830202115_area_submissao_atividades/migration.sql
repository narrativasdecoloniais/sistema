-- AlterTable
ALTER TABLE "atividades" ADD COLUMN     "areaSubmissaoId" TEXT;

-- AddForeignKey
ALTER TABLE "atividades" ADD CONSTRAINT "atividades_areaSubmissaoId_fkey" FOREIGN KEY ("areaSubmissaoId") REFERENCES "areas_submissao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
