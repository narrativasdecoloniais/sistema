-- AlterTable
ALTER TABLE "submissoes" ADD COLUMN "emailResultadoSolicitadoEm" TIMESTAMP(3),
ADD COLUMN "emailResultadoSoPrincipal" BOOLEAN NOT NULL DEFAULT false;

-- Edições em que o envio já foi disparado (antes por divulgação, depois pelo
-- botão de envio): todos os trabalhos com decisão foram pedidos de uma vez,
-- com a escolha de destinatários que ficava na edição.
UPDATE "submissoes" AS s
SET "emailResultadoSolicitadoEm" = COALESCE(s."emailResultadoEnviadoEm", e."resultadoDivulgadoEm"),
    "emailResultadoSoPrincipal" = e."emailResultadoSoAutorPrincipal"
FROM "edicoes" AS e
WHERE s."edicaoId" = e."id"
  AND e."resultadoDivulgadoEm" IS NOT NULL
  AND s."decisaoFinal" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "submissoes" AS x
    WHERE x."edicaoId" = e."id"
      AND (x."emailResultadoEnviadoEm" IS NOT NULL OR x."emailResultadoErro" IS NOT NULL)
  );

-- A escolha de destinatários passou da edição para cada submissão. A coluna
-- "edicoes"."emailResultadoSoAutorPrincipal" saiu do schema mas fica no banco
-- por enquanto: o backend anterior ainda a lê, e removê-la aqui o derrubaria
-- entre esta migração e o deploy novo. Remover numa migração futura.
