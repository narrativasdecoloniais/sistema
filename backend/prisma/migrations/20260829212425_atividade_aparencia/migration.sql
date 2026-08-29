-- AlterTable
ALTER TABLE "atividades" ADD COLUMN     "corBuzioAtividade" TEXT NOT NULL DEFAULT 'BARRO',
ADD COLUMN     "corFundoAtividade" TEXT NOT NULL DEFAULT 'PAPEL',
ADD COLUMN     "corTextoAtividade" TEXT NOT NULL DEFAULT 'TINTA',
ADD COLUMN     "mostrarFaixaAtividade" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "opacidadeFundoAtividade" INTEGER NOT NULL DEFAULT 100;
