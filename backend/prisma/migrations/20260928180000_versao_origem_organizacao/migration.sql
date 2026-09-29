-- CreateEnum
CREATE TYPE "OrigemVersao" AS ENUM ('CORRECAO_AUTOR', 'ORGANIZACAO');

-- AlterTable
ALTER TABLE "submissao_versoes" ADD COLUMN     "editadoPorId" TEXT,
ADD COLUMN     "origem" "OrigemVersao" NOT NULL DEFAULT 'CORRECAO_AUTOR';

