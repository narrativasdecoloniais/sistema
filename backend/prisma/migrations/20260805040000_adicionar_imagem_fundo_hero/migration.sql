-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "fundoHeroTipo" "TipoFaixaHero" NOT NULL DEFAULT 'COR',
ADD COLUMN     "imagemFundoHeroDesktop" TEXT,
ADD COLUMN     "imagemFundoHeroMobile" TEXT;

