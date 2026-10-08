-- Onde o aviso da atividade (destaque) aparece; por padrão, em todos os lugares.
CREATE TYPE "LocalAvisoAtividade" AS ENUM ('PROGRAMACAO', 'PAGINA_ATIVIDADE', 'INSCRICAO', 'COMPROVANTE');

ALTER TABLE "atividades"
ADD COLUMN "destaqueLocais" "LocalAvisoAtividade"[] DEFAULT ARRAY['PROGRAMACAO', 'PAGINA_ATIVIDADE', 'INSCRICAO', 'COMPROVANTE']::"LocalAvisoAtividade"[];
