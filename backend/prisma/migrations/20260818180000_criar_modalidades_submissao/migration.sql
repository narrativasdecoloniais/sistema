-- Cadastro de modalidades de submissão (áreas temáticas e pessoas
-- envolvidas), substituindo o catálogo antes fixo em
-- frontend/lib/modalidadesSubmissao.js. A nova seção de permissão
-- (SUBMISSOES_MODALIDADES) é só criada aqui, sem uso — o backfill de quem
-- já tem acesso fica numa migração separada, porque Postgres não permite
-- usar um valor de enum recém-criado na mesma transação que o criou.

-- CreateEnum
CREATE TYPE "PapelPessoaArea" AS ENUM ('COORDENACAO', 'CONVIDADO');

-- AlterEnum
ALTER TYPE "SecaoAdmin" ADD VALUE 'SUBMISSOES_MODALIDADES';

-- CreateTable
CREATE TABLE "modalidades_submissao" (
    "id" TEXT NOT NULL,
    "edicaoId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "subtitulo" TEXT,
    "prazoInicio" TIMESTAMP(3) NOT NULL,
    "prazoFim" TIMESTAMP(3) NOT NULL,
    "resumoCurto" TEXT NOT NULL,
    "perguntaTitulo" TEXT NOT NULL,
    "descricao" TEXT,
    "linkRotulo" TEXT NOT NULL DEFAULT 'Saiba mais',
    "rotuloItem" TEXT NOT NULL DEFAULT 'Área',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modalidades_submissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas_submissao" (
    "id" TEXT NOT NULL,
    "modalidadeSubmissaoId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "areas_submissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pessoas_area_submissao" (
    "id" TEXT NOT NULL,
    "areaSubmissaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "afiliacao" TEXT,
    "papel" "PapelPessoaArea" NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pessoas_area_submissao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "modalidades_submissao_edicaoId_slug_key" ON "modalidades_submissao"("edicaoId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "areas_submissao_modalidadeSubmissaoId_slug_key" ON "areas_submissao"("modalidadeSubmissaoId", "slug");

-- AddForeignKey
ALTER TABLE "modalidades_submissao" ADD CONSTRAINT "modalidades_submissao_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas_submissao" ADD CONSTRAINT "areas_submissao_modalidadeSubmissaoId_fkey" FOREIGN KEY ("modalidadeSubmissaoId") REFERENCES "modalidades_submissao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoas_area_submissao" ADD CONSTRAINT "pessoas_area_submissao_areaSubmissaoId_fkey" FOREIGN KEY ("areaSubmissaoId") REFERENCES "areas_submissao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
