-- Campos de cor da edição deixam de ser enum (CorSecao/CorPublica, 7 valores
-- fixos) e passam a aceitar qualquer hex, além dos tokens da paleta curada
-- (ver CampoCorSecao.jsx no frontend) — o texto do enum já é idêntico ao
-- valor de string desejado, então o "USING ...::text" preserva os dados
-- existentes sem transformação.

-- AlterTable
ALTER TABLE "edicoes"
  ALTER COLUMN "corFundoRealizadores" TYPE TEXT USING "corFundoRealizadores"::text,
  ALTER COLUMN "corFundoApoiadores" TYPE TEXT USING "corFundoApoiadores"::text,
  ALTER COLUMN "corFundoHero" TYPE TEXT USING "corFundoHero"::text,
  ALTER COLUMN "corTextoHero" TYPE TEXT USING "corTextoHero"::text,
  ALTER COLUMN "corBuzioHero" TYPE TEXT USING "corBuzioHero"::text,
  ALTER COLUMN "corFaixaHeroDesktop" TYPE TEXT USING "corFaixaHeroDesktop"::text,
  ALTER COLUMN "corFaixaHeroMobile" TYPE TEXT USING "corFaixaHeroMobile"::text,
  ALTER COLUMN "corFundoNavTopo" TYPE TEXT USING "corFundoNavTopo"::text,
  ALTER COLUMN "corTextoNavTopo" TYPE TEXT USING "corTextoNavTopo"::text,
  ALTER COLUMN "corIconeNavTopo" TYPE TEXT USING "corIconeNavTopo"::text,
  ALTER COLUMN "corBordaNavTopo" TYPE TEXT USING "corBordaNavTopo"::text,
  ALTER COLUMN "corFundoNavRolado" TYPE TEXT USING "corFundoNavRolado"::text,
  ALTER COLUMN "corTextoNavRolado" TYPE TEXT USING "corTextoNavRolado"::text,
  ALTER COLUMN "corIconeNavRolado" TYPE TEXT USING "corIconeNavRolado"::text,
  ALTER COLUMN "corBordaNavRolado" TYPE TEXT USING "corBordaNavRolado"::text,
  ALTER COLUMN "corFundoApresentacao" TYPE TEXT USING "corFundoApresentacao"::text,
  ALTER COLUMN "corTextoApresentacao" TYPE TEXT USING "corTextoApresentacao"::text,
  ALTER COLUMN "corBuzioApresentacao" TYPE TEXT USING "corBuzioApresentacao"::text,
  ALTER COLUMN "corFundoBotaoApresentacao" TYPE TEXT USING "corFundoBotaoApresentacao"::text,
  ALTER COLUMN "corTextoBotaoApresentacao" TYPE TEXT USING "corTextoBotaoApresentacao"::text,
  ALTER COLUMN "corFundoModalidades" TYPE TEXT USING "corFundoModalidades"::text,
  ALTER COLUMN "corTextoModalidades" TYPE TEXT USING "corTextoModalidades"::text,
  ALTER COLUMN "corBuzioModalidades" TYPE TEXT USING "corBuzioModalidades"::text,
  ALTER COLUMN "corFundoCardModalidades" TYPE TEXT USING "corFundoCardModalidades"::text,
  ALTER COLUMN "corTextoCardModalidades" TYPE TEXT USING "corTextoCardModalidades"::text,
  ALTER COLUMN "corTextoSecundarioCardModalidades" TYPE TEXT USING "corTextoSecundarioCardModalidades"::text,
  ALTER COLUMN "corAcentoCardModalidades" TYPE TEXT USING "corAcentoCardModalidades"::text,
  ALTER COLUMN "corFundoBotaoCardModalidades" TYPE TEXT USING "corFundoBotaoCardModalidades"::text,
  ALTER COLUMN "corTextoBotaoCardModalidades" TYPE TEXT USING "corTextoBotaoCardModalidades"::text,
  ALTER COLUMN "corFundoAgenda" TYPE TEXT USING "corFundoAgenda"::text,
  ALTER COLUMN "corTextoAgenda" TYPE TEXT USING "corTextoAgenda"::text,
  ALTER COLUMN "corBuzioAgenda" TYPE TEXT USING "corBuzioAgenda"::text,
  ALTER COLUMN "corFundoCardAgenda" TYPE TEXT USING "corFundoCardAgenda"::text,
  ALTER COLUMN "corTextoCardAgenda" TYPE TEXT USING "corTextoCardAgenda"::text,
  ALTER COLUMN "corTextoSecundarioCardAgenda" TYPE TEXT USING "corTextoSecundarioCardAgenda"::text,
  ALTER COLUMN "corAcentoCardAgenda" TYPE TEXT USING "corAcentoCardAgenda"::text,
  ALTER COLUMN "corFundoPublicacoes" TYPE TEXT USING "corFundoPublicacoes"::text,
  ALTER COLUMN "corTextoPublicacoes" TYPE TEXT USING "corTextoPublicacoes"::text,
  ALTER COLUMN "corBuzioPublicacoes" TYPE TEXT USING "corBuzioPublicacoes"::text;

-- Os defaults dependiam do tipo enum — recriar como literal de texto agora
-- que a coluna é TEXT (o ALTER COLUMN TYPE acima já derruba o default
-- anterior).
ALTER TABLE "edicoes"
  ALTER COLUMN "corFundoRealizadores" SET DEFAULT 'BARRO',
  ALTER COLUMN "corFundoApoiadores" SET DEFAULT 'BARRO',
  ALTER COLUMN "corFundoHero" SET DEFAULT 'PAPEL',
  ALTER COLUMN "corTextoHero" SET DEFAULT 'TINTA',
  ALTER COLUMN "corBuzioHero" SET DEFAULT 'BUZIO',
  ALTER COLUMN "corFaixaHeroDesktop" SET DEFAULT 'OCRE',
  ALTER COLUMN "corFaixaHeroMobile" SET DEFAULT 'OCRE',
  ALTER COLUMN "corFundoNavTopo" SET DEFAULT 'PAPEL',
  ALTER COLUMN "corTextoNavTopo" SET DEFAULT 'TINTA',
  ALTER COLUMN "corIconeNavTopo" SET DEFAULT 'TINTA',
  ALTER COLUMN "corBordaNavTopo" SET DEFAULT 'TINTA',
  ALTER COLUMN "corFundoNavRolado" SET DEFAULT 'CERRADO',
  ALTER COLUMN "corTextoNavRolado" SET DEFAULT 'PAPEL',
  ALTER COLUMN "corIconeNavRolado" SET DEFAULT 'BUZIO',
  ALTER COLUMN "corBordaNavRolado" SET DEFAULT 'BUZIO',
  ALTER COLUMN "corFundoApresentacao" SET DEFAULT 'PAPEL',
  ALTER COLUMN "corTextoApresentacao" SET DEFAULT 'TINTA',
  ALTER COLUMN "corBuzioApresentacao" SET DEFAULT 'BARRO',
  ALTER COLUMN "corFundoBotaoApresentacao" SET DEFAULT 'BARRO',
  ALTER COLUMN "corTextoBotaoApresentacao" SET DEFAULT 'PAPEL',
  ALTER COLUMN "corFundoModalidades" SET DEFAULT 'PAPEL',
  ALTER COLUMN "corTextoModalidades" SET DEFAULT 'TINTA',
  ALTER COLUMN "corBuzioModalidades" SET DEFAULT 'BUZIO',
  ALTER COLUMN "corFundoCardModalidades" SET DEFAULT 'OCRE',
  ALTER COLUMN "corTextoCardModalidades" SET DEFAULT 'TINTA',
  ALTER COLUMN "corTextoSecundarioCardModalidades" SET DEFAULT 'TINTA',
  ALTER COLUMN "corAcentoCardModalidades" SET DEFAULT 'BARRO',
  ALTER COLUMN "corFundoBotaoCardModalidades" SET DEFAULT 'BARRO',
  ALTER COLUMN "corTextoBotaoCardModalidades" SET DEFAULT 'PAPEL',
  ALTER COLUMN "corFundoAgenda" SET DEFAULT 'PAPEL',
  ALTER COLUMN "corTextoAgenda" SET DEFAULT 'TINTA',
  ALTER COLUMN "corBuzioAgenda" SET DEFAULT 'BUZIO',
  ALTER COLUMN "corFundoCardAgenda" SET DEFAULT 'OCRE',
  ALTER COLUMN "corTextoCardAgenda" SET DEFAULT 'TINTA',
  ALTER COLUMN "corTextoSecundarioCardAgenda" SET DEFAULT 'TINTA',
  ALTER COLUMN "corAcentoCardAgenda" SET DEFAULT 'BARRO',
  ALTER COLUMN "corFundoPublicacoes" SET DEFAULT 'PAPEL',
  ALTER COLUMN "corTextoPublicacoes" SET DEFAULT 'TINTA',
  ALTER COLUMN "corBuzioPublicacoes" SET DEFAULT 'BUZIO';

-- DropEnum
DROP TYPE "CorSecao";
DROP TYPE "CorPublica";
