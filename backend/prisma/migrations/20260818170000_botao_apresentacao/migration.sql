-- Botões "Inscreva-se"/"Conheça o GPDES" da seção Apresentação ganham cor
-- customizável, mesmo mecanismo do botão de Modalidades. Defaults
-- reproduzem a aparência hardcoded de hoje (fundo barro, texto papel).
ALTER TABLE "edicoes" ADD COLUMN     "corFundoBotaoApresentacao" "CorPublica" NOT NULL DEFAULT 'BARRO',
ADD COLUMN     "corTextoBotaoApresentacao" "CorPublica" NOT NULL DEFAULT 'PAPEL';
