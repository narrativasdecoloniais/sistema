-- CreateEnum
CREATE TYPE "CredenciamentoAnais" AS ENUM ('NAO_EXIGIR', 'ALGUM_AUTOR', 'AUTOR_PRINCIPAL');

-- AlterTable: os padrões repetem o critério que estava fixo no código
-- (aprovados para formatação, com pelo menos um autor credenciado).
ALTER TABLE "anais_edicao"
  ADD COLUMN "decisoesPublicadas" "DecisaoAvaliacao"[] DEFAULT ARRAY['APROVADO_FORMATACAO']::"DecisaoAvaliacao"[],
  ADD COLUMN "exigirCorrecaoConcluida" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "credenciamentoExigido" "CredenciamentoAnais" NOT NULL DEFAULT 'ALGUM_AUTOR';
