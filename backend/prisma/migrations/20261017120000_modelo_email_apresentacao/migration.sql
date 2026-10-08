-- Texto do aviso de apresentação editável pela organização, um por edição.
CREATE TABLE "modelos_email_apresentacao" (
    "id" TEXT NOT NULL,
    "edicaoId" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modelos_email_apresentacao_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "modelos_email_apresentacao_edicaoId_key" ON "modelos_email_apresentacao"("edicaoId");

ALTER TABLE "modelos_email_apresentacao" ADD CONSTRAINT "modelos_email_apresentacao_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
