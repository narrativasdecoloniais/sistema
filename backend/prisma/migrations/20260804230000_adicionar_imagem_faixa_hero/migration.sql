-- CreateEnum
CREATE TYPE "TipoFaixaHero" AS ENUM ('COR', 'IMAGEM');

-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "faixaHeroTipo" "TipoFaixaHero" NOT NULL DEFAULT 'COR',
ADD COLUMN     "imagemFaixaHero" TEXT;

