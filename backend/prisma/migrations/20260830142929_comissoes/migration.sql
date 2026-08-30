-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SecaoAdmin" ADD VALUE 'COMISSOES';
ALTER TYPE "SecaoAdmin" ADD VALUE 'PAGINA_COMISSOES';
ALTER TYPE "SecaoAdmin" ADD VALUE 'TIPOS_COMISSAO';

-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "corBuzioComissoes" TEXT NOT NULL DEFAULT 'BUZIO',
ADD COLUMN     "corFundoComissoes" TEXT NOT NULL DEFAULT 'PAPEL',
ADD COLUMN     "corTextoComissoes" TEXT NOT NULL DEFAULT 'TINTA',
ADD COLUMN     "corpoComissoes" TEXT,
ADD COLUMN     "mostrarFaixaComissoes" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "opacidadeFundoComissoes" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "tituloComissoes" TEXT;

-- CreateTable
CREATE TABLE "comissoes" (
    "id" TEXT NOT NULL,
    "edicaoId" TEXT NOT NULL,
    "tipoComissaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "breveDescricao" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comissao_membros" (
    "id" TEXT NOT NULL,
    "comissaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comissao_membros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_comissao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_comissao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipos_comissao_nome_key" ON "tipos_comissao"("nome");

-- AddForeignKey
ALTER TABLE "comissoes" ADD CONSTRAINT "comissoes_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissoes" ADD CONSTRAINT "comissoes_tipoComissaoId_fkey" FOREIGN KEY ("tipoComissaoId") REFERENCES "tipos_comissao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissao_membros" ADD CONSTRAINT "comissao_membros_comissaoId_fkey" FOREIGN KEY ("comissaoId") REFERENCES "comissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
