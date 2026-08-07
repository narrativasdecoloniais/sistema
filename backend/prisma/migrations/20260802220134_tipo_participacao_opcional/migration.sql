-- DropForeignKey
ALTER TABLE "atividade_pessoas" DROP CONSTRAINT "atividade_pessoas_tipoParticipacaoId_fkey";

-- AlterTable
ALTER TABLE "atividade_pessoas" ALTER COLUMN "tipoParticipacaoId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "atividade_pessoas" ADD CONSTRAINT "atividade_pessoas_tipoParticipacaoId_fkey" FOREIGN KEY ("tipoParticipacaoId") REFERENCES "tipos_participacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
