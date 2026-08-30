-- AlterEnum
ALTER TYPE "SecaoAdmin" ADD VALUE 'GRUPOS_CONTEUDO';

-- CreateTable
CREATE TABLE "grupos_conteudo" (
    "id" TEXT NOT NULL,
    "edicaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grupos_conteudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listas_conteudo" (
    "id" TEXT NOT NULL,
    "grupoConteudoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listas_conteudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_conteudo" (
    "id" TEXT NOT NULL,
    "listaConteudoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "imagem" TEXT,
    "link" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_conteudo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "grupos_conteudo" ADD CONSTRAINT "grupos_conteudo_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listas_conteudo" ADD CONSTRAINT "listas_conteudo_grupoConteudoId_fkey" FOREIGN KEY ("grupoConteudoId") REFERENCES "grupos_conteudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_conteudo" ADD CONSTRAINT "itens_conteudo_listaConteudoId_fkey" FOREIGN KEY ("listaConteudoId") REFERENCES "listas_conteudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
