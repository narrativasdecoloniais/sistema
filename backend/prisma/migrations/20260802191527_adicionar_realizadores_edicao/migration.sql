-- CreateTable
CREATE TABLE "edicao_realizadores" (
    "id" TEXT NOT NULL,
    "edicaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "imagem" TEXT NOT NULL,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edicao_realizadores_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "edicao_realizadores" ADD CONSTRAINT "edicao_realizadores_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
