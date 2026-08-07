-- CreateEnum
CREATE TYPE "CorPublica" AS ENUM ('TINTA', 'BARRO', 'OCRE', 'BUZIO', 'AREIA', 'PAPEL', 'CERRADO');

-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "corBuzioHero" "CorPublica" NOT NULL DEFAULT 'BUZIO',
ADD COLUMN     "corFundoHero" "CorSecao" NOT NULL DEFAULT 'PAPEL',
ADD COLUMN     "corTextoHero" "CorPublica" NOT NULL DEFAULT 'TINTA';

