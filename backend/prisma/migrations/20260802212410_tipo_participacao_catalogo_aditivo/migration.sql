-- AlterTable
ALTER TABLE "atividade_pessoas" ADD COLUMN     "breveDescricao" TEXT,
ADD COLUMN     "tipoParticipacaoId" TEXT;

-- CreateTable
CREATE TABLE "tipos_participacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_participacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipos_participacao_nome_key" ON "tipos_participacao"("nome");

-- AddForeignKey
ALTER TABLE "atividade_pessoas" ADD CONSTRAINT "atividade_pessoas_tipoParticipacaoId_fkey" FOREIGN KEY ("tipoParticipacaoId") REFERENCES "tipos_participacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
