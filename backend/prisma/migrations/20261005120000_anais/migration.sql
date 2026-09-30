-- CreateEnum
CREATE TYPE "LicencaAnais" AS ENUM ('CC_BY', 'CC_BY_SA', 'CC_BY_NC', 'CC_BY_NC_SA', 'CC_BY_ND', 'CC_BY_NC_ND', 'TODOS_DIREITOS_RESERVADOS');

-- CreateTable
CREATE TABLE "anais_edicao" (
    "id" TEXT NOT NULL,
    "edicaoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "subtitulo" TEXT,
    "nomeEvento" TEXT,
    "issn" TEXT,
    "isbn" TEXT,
    "editora" TEXT,
    "localPublicacao" TEXT,
    "anoPublicacao" INTEGER,
    "organizadores" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "licenca" "LicencaAnais" NOT NULL DEFAULT 'CC_BY',
    "apresentacao" TEXT,
    "fichaCatalografica" TEXT,
    "gruposConteudoIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publicadoEm" TIMESTAMP(3),
    "pdfUrl" TEXT,
    "pdfGeradoEm" TIMESTAMP(3),
    "docxUrl" TEXT,
    "docxGeradoEm" TIMESTAMP(3),
    "geracaoFormato" TEXT,
    "geracaoIniciadaEm" TIMESTAMP(3),
    "erroGeracao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anais_edicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artigos_anais" (
    "id" TEXT NOT NULL,
    "edicaoId" TEXT NOT NULL,
    "submissaoId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ocultoEm" TIMESTAMP(3),
    "paginaInicial" INTEGER,
    "paginaFinal" INTEGER,
    "visualizacoes" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artigos_anais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios_anais" (
    "id" TEXT NOT NULL,
    "artigoAnaisId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "respostaAId" TEXT,
    "texto" TEXT NOT NULL,
    "ocultoEm" TIMESTAMP(3),
    "ocultoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_anais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "anais_edicao_edicaoId_key" ON "anais_edicao"("edicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "artigos_anais_submissaoId_key" ON "artigos_anais"("submissaoId");

-- CreateIndex
CREATE UNIQUE INDEX "artigos_anais_edicaoId_slug_key" ON "artigos_anais"("edicaoId", "slug");

-- CreateIndex
CREATE INDEX "comentarios_anais_artigoAnaisId_createdAt_idx" ON "comentarios_anais"("artigoAnaisId", "createdAt");

-- AddForeignKey
ALTER TABLE "anais_edicao" ADD CONSTRAINT "anais_edicao_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artigos_anais" ADD CONSTRAINT "artigos_anais_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artigos_anais" ADD CONSTRAINT "artigos_anais_submissaoId_fkey" FOREIGN KEY ("submissaoId") REFERENCES "submissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_anais" ADD CONSTRAINT "comentarios_anais_artigoAnaisId_fkey" FOREIGN KEY ("artigoAnaisId") REFERENCES "artigos_anais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_anais" ADD CONSTRAINT "comentarios_anais_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_anais" ADD CONSTRAINT "comentarios_anais_respostaAId_fkey" FOREIGN KEY ("respostaAId") REFERENCES "comentarios_anais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

