-- Selo de destaque abaixo do título da página pública /monitoria (ex.: "Com
-- certificado de 60h"). Nulo = sem selo.
ALTER TABLE "edicoes" ADD COLUMN "destaqueMonitoria" TEXT;
