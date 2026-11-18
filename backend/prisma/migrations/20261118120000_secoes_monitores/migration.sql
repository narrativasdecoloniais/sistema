-- Seções do admin liberadas, por edição, aos monitores selecionados.
ALTER TABLE "Edicao" ADD COLUMN "secoesMonitores" "SecaoAdmin"[] DEFAULT ARRAY[]::"SecaoAdmin"[];
