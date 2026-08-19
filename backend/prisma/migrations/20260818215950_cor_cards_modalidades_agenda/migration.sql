-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "corAcentoCardAgenda" "CorPublica" NOT NULL DEFAULT 'BARRO',
ADD COLUMN     "corAcentoCardModalidades" "CorPublica" NOT NULL DEFAULT 'BARRO',
ADD COLUMN     "corFundoCardAgenda" "CorSecao" NOT NULL DEFAULT 'OCRE',
ADD COLUMN     "corFundoCardModalidades" "CorSecao" NOT NULL DEFAULT 'OCRE',
ADD COLUMN     "corTextoCardAgenda" "CorPublica" NOT NULL DEFAULT 'TINTA',
ADD COLUMN     "corTextoCardModalidades" "CorPublica" NOT NULL DEFAULT 'TINTA',
ADD COLUMN     "opacidadeFundoCardAgenda" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "opacidadeFundoCardModalidades" INTEGER NOT NULL DEFAULT 6;
