-- Inclusão de monitor(a) pela Coordenação de Monitoria: os dados do
-- formulário passam a ser opcionais (a pessoa completa depois) e a inscrição
-- registra quem a incluiu.
ALTER TABLE "inscricoes_monitoria"
  ALTER COLUMN "dataNascimento" DROP NOT NULL,
  ALTER COLUMN "telefone" DROP NOT NULL,
  ALTER COLUMN "cursoInstituicao" DROP NOT NULL,
  ALTER COLUMN "experienciaAnterior" DROP NOT NULL,
  ALTER COLUMN "precisaAdaptacao" DROP NOT NULL,
  ALTER COLUMN "cienteEm" DROP NOT NULL,
  ADD COLUMN "incluidaPorId" TEXT;

ALTER TABLE "inscricoes_monitoria"
  ADD CONSTRAINT "inscricoes_monitoria_incluidaPorId_fkey"
  FOREIGN KEY ("incluidaPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
