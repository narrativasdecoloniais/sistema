-- CreateEnum
CREATE TYPE "CorSecao" AS ENUM ('PAPEL', 'TINTA', 'BARRO', 'OCRE', 'CERRADO');

-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "corFundoRealizadores" "CorSecao" NOT NULL DEFAULT 'BARRO';
