-- AlterTable
ALTER TABLE "edicoes" ADD COLUMN     "corBuzioAgenda" "CorPublica" NOT NULL DEFAULT 'BUZIO',
ADD COLUMN     "corBuzioApresentacao" "CorPublica" NOT NULL DEFAULT 'BARRO',
ADD COLUMN     "corBuzioModalidades" "CorPublica" NOT NULL DEFAULT 'BUZIO',
ADD COLUMN     "corBuzioPublicacoes" "CorPublica" NOT NULL DEFAULT 'BUZIO',
ADD COLUMN     "corTextoAgenda" "CorPublica" NOT NULL DEFAULT 'TINTA',
ADD COLUMN     "corTextoApresentacao" "CorPublica" NOT NULL DEFAULT 'TINTA',
ADD COLUMN     "corTextoModalidades" "CorPublica" NOT NULL DEFAULT 'TINTA',
ADD COLUMN     "corTextoPublicacoes" "CorPublica" NOT NULL DEFAULT 'TINTA',
ADD COLUMN     "opacidadeFundoAgenda" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "opacidadeFundoApresentacao" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "opacidadeFundoModalidades" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "opacidadeFundoPublicacoes" INTEGER NOT NULL DEFAULT 100;
