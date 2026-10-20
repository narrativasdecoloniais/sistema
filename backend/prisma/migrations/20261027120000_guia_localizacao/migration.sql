-- Guia da dobra Localização: subcategoria, descrição, ordem e marca de
-- localização aproximada nos pontos; ordem nos tipos; texto de abertura da
-- dobra e textos por tipo na edição.

-- AlterTable
ALTER TABLE "tipos_ponto_interesse" ADD COLUMN "ordem" INTEGER;

-- AlterTable
ALTER TABLE "edicao_pontos_interesse"
  ADD COLUMN "grupo" TEXT,
  ADD COLUMN "descricao" TEXT,
  ADD COLUMN "aproximado" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "ordem" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "edicoes"
  ADD COLUMN "introducaoLocalizacao" TEXT,
  ADD COLUMN "textosTiposLocalizacao" JSONB;

-- Pontos já cadastrados mantêm a ordem em que foram criados.
UPDATE "edicao_pontos_interesse" AS p
SET "ordem" = o.posicao
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "edicaoId" ORDER BY "createdAt") - 1 AS posicao
  FROM "edicao_pontos_interesse"
) AS o
WHERE p."id" = o."id";
