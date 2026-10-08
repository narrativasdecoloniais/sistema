-- Apresentação dos trabalhos em duas etapas: "apresentacaoPublicadaEm" passa a
-- significar só "liberada para os autores"; a divulgação na página pública
-- das atividades ganha campo próprio. Edição que já tinha a distribuição
-- publicada continua pública, como antes.
ALTER TABLE "edicoes" ADD COLUMN "apresentacaoPublicaEm" TIMESTAMP(3);

UPDATE "edicoes" SET "apresentacaoPublicaEm" = "apresentacaoPublicadaEm" WHERE "apresentacaoPublicadaEm" IS NOT NULL;
