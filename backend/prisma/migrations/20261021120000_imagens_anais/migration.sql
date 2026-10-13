-- Capa e imagens de cabeçalho/rodapé dos Anais, enviadas pela organização.
ALTER TABLE "anais_edicao" ADD COLUMN "imagemCapa" TEXT;
ALTER TABLE "anais_edicao" ADD COLUMN "imagemCabecalho" TEXT;
ALTER TABLE "anais_edicao" ADD COLUMN "imagemRodape" TEXT;
