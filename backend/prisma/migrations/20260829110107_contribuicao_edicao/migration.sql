-- CreateEnum
CREATE TYPE "TipoAcaoContribuicao" AS ENUM ('NENHUMA', 'LINK', 'COPIAR');

-- AlterEnum
ALTER TYPE "SecaoAdmin" ADD VALUE 'PAGINA_CONTRIBUICAO';

-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "copiaContribuicaoRotulo" TEXT,
ADD COLUMN     "copiaContribuicaoValor" TEXT,
ADD COLUMN     "corpoContribuicao" TEXT,
ADD COLUMN     "linkContribuicaoRotulo" TEXT,
ADD COLUMN     "linkContribuicaoUrl" TEXT,
ADD COLUMN     "tipoAcaoContribuicao" "TipoAcaoContribuicao" NOT NULL DEFAULT 'NENHUMA',
ADD COLUMN     "tituloContribuicao" TEXT;
