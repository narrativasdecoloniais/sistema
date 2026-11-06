-- Divulgar ou não a ordem de apresentação dos trabalhos aos autores e ao
-- público. Padrão desligado: a V edição não apresenta em ordem, e a ordem que
-- o admin grava ao distribuir deixava de ser verdade para quem lia "3º a
-- apresentar".
ALTER TABLE "edicoes" ADD COLUMN "apresentacaoComOrdem" BOOLEAN NOT NULL DEFAULT false;
