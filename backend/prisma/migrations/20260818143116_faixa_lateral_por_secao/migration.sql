-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "mostrarFaixaAgenda" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mostrarFaixaApresentacao" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mostrarFaixaModalidades" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mostrarFaixaPublicacoes" BOOLEAN NOT NULL DEFAULT true;
