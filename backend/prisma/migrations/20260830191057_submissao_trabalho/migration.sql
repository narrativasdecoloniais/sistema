-- AlterEnum
ALTER TYPE "TipoToken" ADD VALUE 'ENTRAR_SUBMISSAO';

-- CreateTable
CREATE TABLE "submissoes" (
    "id" TEXT NOT NULL,
    "edicaoId" TEXT NOT NULL,
    "modalidadeSubmissaoId" TEXT NOT NULL,
    "areaSubmissaoId" TEXT,
    "titulo" TEXT NOT NULL,
    "resumo" TEXT NOT NULL,
    "referenciaBibliografica" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissao_autores" (
    "id" TEXT NOT NULL,
    "submissaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "orcid" TEXT,
    "usuarioId" TEXT,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissao_autores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "submissao_autores_usuarioId_idx" ON "submissao_autores"("usuarioId");

-- AddForeignKey
ALTER TABLE "submissoes" ADD CONSTRAINT "submissoes_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissoes" ADD CONSTRAINT "submissoes_modalidadeSubmissaoId_fkey" FOREIGN KEY ("modalidadeSubmissaoId") REFERENCES "modalidades_submissao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissoes" ADD CONSTRAINT "submissoes_areaSubmissaoId_fkey" FOREIGN KEY ("areaSubmissaoId") REFERENCES "areas_submissao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissoes" ADD CONSTRAINT "submissoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissao_autores" ADD CONSTRAINT "submissao_autores_submissaoId_fkey" FOREIGN KEY ("submissaoId") REFERENCES "submissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissao_autores" ADD CONSTRAINT "submissao_autores_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
