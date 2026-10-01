-- Pronome de tratamento na inscrição de monitoria passa a ser opcional.
ALTER TABLE "inscricoes_monitoria" ALTER COLUMN "pronome" DROP NOT NULL;
