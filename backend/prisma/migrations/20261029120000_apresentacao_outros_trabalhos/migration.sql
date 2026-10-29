-- Terceira etapa da apresentação dos trabalhos: cada autor passa a ver os
-- demais trabalhos da própria atividade em Minhas submissões, sem divulgar ao
-- público. Nulo = oculto (padrão de todas as edições existentes).
ALTER TABLE "edicoes" ADD COLUMN "apresentacaoOutrosTrabalhosEm" TIMESTAMP(3);
