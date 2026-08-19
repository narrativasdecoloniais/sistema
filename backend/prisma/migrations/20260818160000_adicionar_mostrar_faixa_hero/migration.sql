-- Hero ganha o mesmo toggle independente "mostrar a faixa lateral" que as
-- demais seções já tinham (mostrarFaixaApresentacao/Modalidades/Agenda/
-- Publicacoes/Realizadores) — antes, só o tipo da faixa (COR/IMAGEM/NENHUMA)
-- decidia isso, e como esse tipo é a definição compartilhada por toda a
-- página, setar NENHUMA pra tirar a faixa só da Hero apagava a faixa em
-- todas as seções. Default true preserva a aparência atual.
ALTER TABLE "edicoes" ADD COLUMN "mostrarFaixaHero" BOOLEAN NOT NULL DEFAULT true;
