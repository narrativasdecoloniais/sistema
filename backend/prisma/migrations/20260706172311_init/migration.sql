-- CreateEnum
CREATE TYPE "CategoriaUsuario" AS ENUM ('ESTUDANTE', 'DOCENTE', 'PESQUISADOR', 'COMUNIDADE_EXTERNA');

-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('PARTICIPANTE', 'AVALIADOR', 'ORGANIZADOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "TipoToken" AS ENUM ('CONFIRMACAO_EMAIL', 'RECUPERACAO_SENHA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "instituicao" TEXT NOT NULL,
    "categoria" "CategoriaUsuario" NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "emailConfirmado" BOOLEAN NOT NULL DEFAULT false,
    "papeis" "PapelUsuario"[] DEFAULT ARRAY['PARTICIPANTE']::"PapelUsuario"[],
    "aceiteTermosEm" TIMESTAMP(3) NOT NULL,
    "aceitePrivacidadeEm" TIMESTAMP(3) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "anonimizadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_verificacao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoToken" NOT NULL,
    "token" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_verificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "revogadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cpf_key" ON "usuarios"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_verificacao_token_key" ON "tokens_verificacao"("token");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- AddForeignKey
ALTER TABLE "tokens_verificacao" ADD CONSTRAINT "tokens_verificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
