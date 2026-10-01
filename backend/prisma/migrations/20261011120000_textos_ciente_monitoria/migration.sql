-- Textos dos 3 "Estou ciente de que" da inscrição na monitoria, por edição.
ALTER TABLE "edicoes" ADD COLUMN "cienteFormacaoMonitoria" TEXT;
ALTER TABLE "edicoes" ADD COLUMN "cienteDisponibilidadeMonitoria" TEXT;
ALTER TABLE "edicoes" ADD COLUMN "cienteVoluntariaMonitoria" TEXT;

-- Edição que já tem a chamada de monitoria (V edição) recebe os textos do edital.
UPDATE "edicoes"
SET "cienteFormacaoMonitoria" = 'Preciso participar da formação virtual ou presencial de monitores entre 09 e 20 de novembro de 2026.',
    "cienteDisponibilidadeMonitoria" = 'Preciso ter disponibilidade para atuar presencialmente no evento nos dias 02, 03, 04 e 05 de dezembro de 2026.',
    "cienteVoluntariaMonitoria" = 'A monitoria é voluntária e não implica em remuneração de qualquer tipo.'
WHERE "editalMonitoria" IS NOT NULL OR cardinality("funcoesMonitoria") > 0;
