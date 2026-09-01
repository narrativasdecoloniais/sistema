-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "fimInscricoes" TIMESTAMP(3),
ADD COLUMN     "inicioInscricoes" TIMESTAMP(3),
ADD COLUMN     "inscricoesEncerradasManualmente" BOOLEAN NOT NULL DEFAULT false;
