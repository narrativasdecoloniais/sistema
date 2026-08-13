-- CreateEnum
CREATE TYPE "SecaoAdmin" AS ENUM ('ATIVIDADES', 'PAGINA_EVENTO', 'PROGRAMACAO', 'SUBMISSOES_RECEBIMENTO', 'SUBMISSOES_AVALIACAO', 'SUBMISSOES_RESULTADO', 'SUBMISSOES_APRESENTACAO', 'SUBMISSOES_PUBLICACAO', 'INSCRICOES_GERAIS', 'INSCRICOES_ATIVIDADES', 'CREDENCIAMENTO', 'CERTIFICADOS', 'PARTICIPANTES', 'CONFIGURACOES_EVENTO', 'TIPOS_ATIVIDADE', 'TIPOS_PARTICIPACAO');

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "acessoCompleto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "secoesPermitidas" "SecaoAdmin"[] DEFAULT ARRAY[]::"SecaoAdmin"[];

-- Preserva o comportamento atual: organizadores/admins já existentes tinham
-- acesso a tudo antes desta feature. Sem este backfill, o default
-- acessoCompleto=false zeraria o acesso deles no deploy.
UPDATE "usuarios" SET "acessoCompleto" = true WHERE 'ORGANIZADOR' = ANY("papeis") OR 'ADMIN' = ANY("papeis");
