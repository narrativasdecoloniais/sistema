-- CreateTable
CREATE TABLE "convites_coautor" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "enviadoEm" TIMESTAMP(3),
    "erroEnvio" TEXT,
    "usadoEm" TIMESTAMP(3),
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convites_coautor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "convites_coautor_email_key" ON "convites_coautor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "convites_coautor_token_key" ON "convites_coautor"("token");

-- AddForeignKey
ALTER TABLE "convites_coautor" ADD CONSTRAINT "convites_coautor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
