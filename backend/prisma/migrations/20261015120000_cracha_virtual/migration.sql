-- Crachá virtual: a equipe lê o QR code do participante e credencia (ou
-- registra presença numa atividade). Token por pessoa, vale em todas as edições.
ALTER TYPE "OrigemCredenciamento" ADD VALUE 'CRACHA';

ALTER TABLE "usuarios" ADD COLUMN "tokenCracha" TEXT;

CREATE UNIQUE INDEX "usuarios_tokenCracha_key" ON "usuarios"("tokenCracha");
