-- CreateTable
CREATE TABLE "atividades" (
    "id" TEXT NOT NULL,
    "edicaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "vagas" INTEGER NOT NULL,
    "inicioInscricoes" TIMESTAMP(3) NOT NULL,
    "fimInscricoes" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atividades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "atividades_edicaoId_slug_key" ON "atividades"("edicaoId", "slug");

-- AddForeignKey
ALTER TABLE "atividades" ADD CONSTRAINT "atividades_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
