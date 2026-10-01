-- CreateTable
CREATE TABLE "modelos_email" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modelos_email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "envios_email" (
    "id" TEXT NOT NULL,
    "edicaoId" TEXT,
    "modeloId" TEXT,
    "assunto" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "criadoPorId" TEXT,
    "concluidoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "envios_email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "envios_email_destinatarios" (
    "id" TEXT NOT NULL,
    "envioId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "enviadoEm" TIMESTAMP(3),
    "erro" TEXT,

    CONSTRAINT "envios_email_destinatarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "envios_email_edicaoId_idx" ON "envios_email"("edicaoId");

-- CreateIndex
CREATE INDEX "envios_email_destinatarios_envioId_idx" ON "envios_email_destinatarios"("envioId");

-- CreateIndex
CREATE INDEX "envios_email_destinatarios_usuarioId_idx" ON "envios_email_destinatarios"("usuarioId");

-- CreateIndex
CREATE INDEX "envios_email_destinatarios_enviadoEm_idx" ON "envios_email_destinatarios"("enviadoEm");

-- AddForeignKey
ALTER TABLE "envios_email" ADD CONSTRAINT "envios_email_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios_email" ADD CONSTRAINT "envios_email_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "modelos_email"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios_email" ADD CONSTRAINT "envios_email_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios_email_destinatarios" ADD CONSTRAINT "envios_email_destinatarios_envioId_fkey" FOREIGN KEY ("envioId") REFERENCES "envios_email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios_email_destinatarios" ADD CONSTRAINT "envios_email_destinatarios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
