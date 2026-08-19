-- AlterEnum
ALTER TYPE "SecaoAdmin" ADD VALUE 'PAGINA_APRESENTACAO';
ALTER TYPE "SecaoAdmin" ADD VALUE 'PAGINA_MODALIDADES';
ALTER TYPE "SecaoAdmin" ADD VALUE 'PAGINA_AGENDA';
ALTER TYPE "SecaoAdmin" ADD VALUE 'PAGINA_PUBLICACOES';
ALTER TYPE "SecaoAdmin" ADD VALUE 'PAGINA_REALIZADORES';

-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "corFundoAgenda" "CorSecao" NOT NULL DEFAULT 'PAPEL',
ADD COLUMN     "corFundoApresentacao" "CorSecao" NOT NULL DEFAULT 'PAPEL',
ADD COLUMN     "corFundoModalidades" "CorSecao" NOT NULL DEFAULT 'PAPEL',
ADD COLUMN     "corFundoPublicacoes" "CorSecao" NOT NULL DEFAULT 'PAPEL',
ADD COLUMN     "corpoApresentacao" TEXT,
ADD COLUMN     "corpoModalidades" TEXT,
ADD COLUMN     "corpoPublicacoes" TEXT,
ADD COLUMN     "tituloApresentacao" TEXT,
ADD COLUMN     "tituloModalidades" TEXT,
ADD COLUMN     "tituloPublicacoes" TEXT;
