-- CreateTable
CREATE TABLE "tipos_ponto_interesse" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_ponto_interesse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipos_ponto_interesse_nome_key" ON "tipos_ponto_interesse"("nome");

-- Backfill: um tipo por valor do antigo enum TipoPontoInteresse, mesma
-- cor que já era hardcoded em MapaLocalizacao.jsx (CORES_POR_TIPO).
INSERT INTO "tipos_ponto_interesse" ("id","nome","cor","createdAt","updatedAt") VALUES
  ('03141693-d566-4b4a-a3d9-1eeb022e2060','Local do evento','#9c4a2f',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('0c03834d-299c-448d-83cd-353731acb93f','Hospedagem','#b87c34',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('faab69c2-d842-41fd-b9ab-0baa2033ff78','Restaurante','#55603f',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('3818bf18-a120-4bd8-970c-e34d989bc092','Outro','#201914',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "edicao_pontos_interesse" ADD COLUMN "tipoId" TEXT;

UPDATE "edicao_pontos_interesse" SET "tipoId" = CASE "tipo"
  WHEN 'LOCAL_EVENTO' THEN '03141693-d566-4b4a-a3d9-1eeb022e2060'
  WHEN 'HOSPEDAGEM' THEN '0c03834d-299c-448d-83cd-353731acb93f'
  WHEN 'RESTAURANTE' THEN 'faab69c2-d842-41fd-b9ab-0baa2033ff78'
  ELSE '3818bf18-a120-4bd8-970c-e34d989bc092'
END;

ALTER TABLE "edicao_pontos_interesse" ALTER COLUMN "tipoId" SET NOT NULL;
ALTER TABLE "edicao_pontos_interesse" DROP COLUMN "tipo";

-- DropEnum
DROP TYPE "TipoPontoInteresse";

-- AddForeignKey
ALTER TABLE "edicao_pontos_interesse" ADD CONSTRAINT "edicao_pontos_interesse_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "tipos_ponto_interesse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterEnum
ALTER TYPE "SecaoAdmin" ADD VALUE 'TIPOS_PONTO_INTERESSE';
