-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "corFundoBotaoCardModalidades" "CorPublica" NOT NULL DEFAULT 'BARRO',
ADD COLUMN     "corTextoBotaoCardModalidades" "CorPublica" NOT NULL DEFAULT 'PAPEL',
ADD COLUMN     "corTextoSecundarioCardAgenda" "CorPublica" NOT NULL DEFAULT 'TINTA',
ADD COLUMN     "corTextoSecundarioCardModalidades" "CorPublica" NOT NULL DEFAULT 'TINTA';
