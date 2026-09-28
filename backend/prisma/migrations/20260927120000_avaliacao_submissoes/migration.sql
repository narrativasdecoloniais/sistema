-- CreateEnum
CREATE TYPE "DecisaoAvaliacao" AS ENUM ('APROVADO', 'APROVADO_COM_RESSALVAS', 'REPROVADO');

-- CreateEnum
CREATE TYPE "OrigemAtribuicao" AS ENUM ('AREA', 'MANUAL');

-- CreateEnum
CREATE TYPE "StatusSugestaoArea" AS ENUM ('PENDENTE', 'APROVADA', 'RECUSADA');

-- AlterEnum
ALTER TYPE "TipoToken" ADD VALUE 'CONVITE_AVALIADOR';

-- AlterTable
ALTER TABLE "submissoes" ADD COLUMN     "decisaoFinal" "DecisaoAvaliacao",
ADD COLUMN     "decisaoFinalEm" TIMESTAMP(3),
ADD COLUMN     "decisaoFinalPorId" TEXT;

-- CreateTable
CREATE TABLE "avaliadores_edicao" (
    "id" TEXT NOT NULL,
    "edicaoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliadores_edicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atribuicoes_avaliacao" (
    "id" TEXT NOT NULL,
    "submissaoId" TEXT NOT NULL,
    "avaliadorEdicaoId" TEXT NOT NULL,
    "origem" "OrigemAtribuicao" NOT NULL,
    "decisao" "DecisaoAvaliacao",
    "decididoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atribuicoes_avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sugestoes_troca_area" (
    "id" TEXT NOT NULL,
    "submissaoId" TEXT NOT NULL,
    "avaliadorEdicaoId" TEXT NOT NULL,
    "areaAtualId" TEXT,
    "areaSugeridaId" TEXT NOT NULL,
    "justificativa" TEXT,
    "status" "StatusSugestaoArea" NOT NULL DEFAULT 'PENDENTE',
    "resolvidoPorId" TEXT,
    "resolvidoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sugestoes_troca_area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AreaSubmissaoToAvaliadorEdicao" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "avaliadores_edicao_edicaoId_usuarioId_key" ON "avaliadores_edicao"("edicaoId", "usuarioId");

-- CreateIndex
CREATE INDEX "atribuicoes_avaliacao_avaliadorEdicaoId_idx" ON "atribuicoes_avaliacao"("avaliadorEdicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "atribuicoes_avaliacao_submissaoId_avaliadorEdicaoId_key" ON "atribuicoes_avaliacao"("submissaoId", "avaliadorEdicaoId");

-- CreateIndex
CREATE INDEX "sugestoes_troca_area_submissaoId_idx" ON "sugestoes_troca_area"("submissaoId");

-- CreateIndex
CREATE UNIQUE INDEX "_AreaSubmissaoToAvaliadorEdicao_AB_unique" ON "_AreaSubmissaoToAvaliadorEdicao"("A", "B");

-- CreateIndex
CREATE INDEX "_AreaSubmissaoToAvaliadorEdicao_B_index" ON "_AreaSubmissaoToAvaliadorEdicao"("B");

-- AddForeignKey
ALTER TABLE "avaliadores_edicao" ADD CONSTRAINT "avaliadores_edicao_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliadores_edicao" ADD CONSTRAINT "avaliadores_edicao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atribuicoes_avaliacao" ADD CONSTRAINT "atribuicoes_avaliacao_submissaoId_fkey" FOREIGN KEY ("submissaoId") REFERENCES "submissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atribuicoes_avaliacao" ADD CONSTRAINT "atribuicoes_avaliacao_avaliadorEdicaoId_fkey" FOREIGN KEY ("avaliadorEdicaoId") REFERENCES "avaliadores_edicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sugestoes_troca_area" ADD CONSTRAINT "sugestoes_troca_area_submissaoId_fkey" FOREIGN KEY ("submissaoId") REFERENCES "submissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sugestoes_troca_area" ADD CONSTRAINT "sugestoes_troca_area_avaliadorEdicaoId_fkey" FOREIGN KEY ("avaliadorEdicaoId") REFERENCES "avaliadores_edicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sugestoes_troca_area" ADD CONSTRAINT "sugestoes_troca_area_areaAtualId_fkey" FOREIGN KEY ("areaAtualId") REFERENCES "areas_submissao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sugestoes_troca_area" ADD CONSTRAINT "sugestoes_troca_area_areaSugeridaId_fkey" FOREIGN KEY ("areaSugeridaId") REFERENCES "areas_submissao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AreaSubmissaoToAvaliadorEdicao" ADD CONSTRAINT "_AreaSubmissaoToAvaliadorEdicao_A_fkey" FOREIGN KEY ("A") REFERENCES "areas_submissao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AreaSubmissaoToAvaliadorEdicao" ADD CONSTRAINT "_AreaSubmissaoToAvaliadorEdicao_B_fkey" FOREIGN KEY ("B") REFERENCES "avaliadores_edicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

