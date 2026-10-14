-- Cabeçalho personalizável do PDF individual de cada trabalho dos Anais
-- (linha em negrito e linha de informações depois de "ANAIS"). Nulo = texto
-- automático, como antes.

-- AlterTable
ALTER TABLE "anais_edicao"
  ADD COLUMN "cabecalhoArtigoTitulo" TEXT,
  ADD COLUMN "cabecalhoArtigoTexto" TEXT;
