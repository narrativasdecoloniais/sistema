-- RenameColumn (preserva dados já salvos, em vez de dropar+recriar)
ALTER TABLE "edicoes" RENAME COLUMN "faixaHeroTipo" TO "faixaHeroTipoDesktop";
ALTER TABLE "edicoes" RENAME COLUMN "corFaixaHero" TO "corFaixaHeroDesktop";
ALTER TABLE "edicoes" RENAME COLUMN "imagemFaixaHero" TO "imagemFaixaHeroDesktop";

-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "corFaixaHeroMobile" "CorPublica" NOT NULL DEFAULT 'OCRE',
ADD COLUMN     "faixaHeroTipoMobile" "TipoFaixaHero" NOT NULL DEFAULT 'COR',
ADD COLUMN     "imagemFaixaHeroMobile" TEXT;
