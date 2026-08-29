-- DropForeignKey
ALTER TABLE "atividade_pessoas" DROP CONSTRAINT "atividade_pessoas_tipoParticipacaoId_fkey";

-- AlterTable
ALTER TABLE "atividade_pessoas" DROP COLUMN "tipo",
ALTER COLUMN "tipoParticipacaoId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "atividade_pessoas" ADD CONSTRAINT "atividade_pessoas_tipoParticipacaoId_fkey" FOREIGN KEY ("tipoParticipacaoId") REFERENCES "tipos_participacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
