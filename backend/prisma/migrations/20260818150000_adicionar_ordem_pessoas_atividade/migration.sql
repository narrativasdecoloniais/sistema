-- Pessoas envolvidas passam a ter ordem manual (gestor reordena no admin,
-- dentro de cada tipo de participação) em vez de sempre aparecerem por
-- ordem de criação. Backfill abaixo preserva a ordem atual (por createdAt)
-- das atividades já cadastradas, pra ninguém ver a lista embaralhar quando
-- o deploy sair.
ALTER TABLE "atividade_pessoas" ADD COLUMN "ordem" INTEGER NOT NULL DEFAULT 0;

WITH ordenado AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "atividadeId" ORDER BY "createdAt" ASC) - 1 AS posicao
  FROM "atividade_pessoas"
)
UPDATE "atividade_pessoas" AS ap
SET "ordem" = ordenado.posicao
FROM ordenado
WHERE ap.id = ordenado.id;
