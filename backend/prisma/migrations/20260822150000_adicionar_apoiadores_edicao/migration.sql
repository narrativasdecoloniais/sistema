-- AlterEnum
ALTER TYPE "SecaoAdmin" ADD VALUE 'PAGINA_APOIO';

-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "corFundoApoiadores" "CorSecao" NOT NULL DEFAULT 'BARRO',
ADD COLUMN     "opacidadeFundoApoiadores" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "mostrarFaixaApoiadores" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "edicao_apoiadores" (
    "id" TEXT NOT NULL,
    "edicaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "imagem" TEXT NOT NULL,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edicao_apoiadores_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "edicao_apoiadores" ADD CONSTRAINT "edicao_apoiadores_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
