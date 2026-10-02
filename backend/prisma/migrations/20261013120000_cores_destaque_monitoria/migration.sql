-- Cores do selo de destaque de /monitoria: token da paleta pública (ex.
-- "BARRO") ou hex "#RRGGBB". Nulo = padrão (fundo barro, texto papel).
ALTER TABLE "edicoes" ADD COLUMN "corFundoDestaqueMonitoria" TEXT;
ALTER TABLE "edicoes" ADD COLUMN "corTextoDestaqueMonitoria" TEXT;
