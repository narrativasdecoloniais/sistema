-- DropForeignKey
ALTER TABLE "pessoas_area_submissao" DROP CONSTRAINT "pessoas_area_submissao_areaSubmissaoId_fkey";

-- DropTable
DROP TABLE "pessoas_area_submissao";

-- DropEnum
DROP TYPE "PapelPessoaArea";
