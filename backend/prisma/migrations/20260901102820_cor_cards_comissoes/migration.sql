-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "corAcentoCardComissoes" TEXT NOT NULL DEFAULT 'BARRO',
ADD COLUMN     "corFundoCardComissoes" TEXT NOT NULL DEFAULT 'PAPEL',
ADD COLUMN     "corTextoCardComissoes" TEXT NOT NULL DEFAULT 'TINTA',
ADD COLUMN     "corTextoSecundarioCardComissoes" TEXT NOT NULL DEFAULT 'TINTA',
ADD COLUMN     "opacidadeFundoCardComissoes" INTEGER NOT NULL DEFAULT 100;
