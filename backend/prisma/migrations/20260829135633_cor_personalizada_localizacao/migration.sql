-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "corFundoLocalizacao" TEXT NOT NULL DEFAULT 'PAPEL',
ADD COLUMN     "corTextoLocalizacao" TEXT NOT NULL DEFAULT 'TINTA',
ADD COLUMN     "mostrarFaixaLocalizacao" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "opacidadeFundoLocalizacao" INTEGER NOT NULL DEFAULT 100;
