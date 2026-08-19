-- CreateEnum
CREATE TYPE "TipoFundoNav" AS ENUM ('TRANSPARENTE', 'COR');

-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "corBordaNavRolado" "CorPublica" NOT NULL DEFAULT 'BUZIO',
ADD COLUMN     "corBordaNavTopo" "CorPublica" NOT NULL DEFAULT 'TINTA',
ADD COLUMN     "corFundoNavRolado" "CorSecao" NOT NULL DEFAULT 'CERRADO',
ADD COLUMN     "corFundoNavTopo" "CorSecao" NOT NULL DEFAULT 'PAPEL',
ADD COLUMN     "corIconeNavRolado" "CorPublica" NOT NULL DEFAULT 'BUZIO',
ADD COLUMN     "corIconeNavTopo" "CorPublica" NOT NULL DEFAULT 'TINTA',
ADD COLUMN     "corTextoNavRolado" "CorPublica" NOT NULL DEFAULT 'PAPEL',
ADD COLUMN     "corTextoNavTopo" "CorPublica" NOT NULL DEFAULT 'TINTA',
ADD COLUMN     "fundoNavTopoTipo" "TipoFundoNav" NOT NULL DEFAULT 'TRANSPARENTE',
ADD COLUMN     "navMesmoEstilo" BOOLEAN NOT NULL DEFAULT false;
