-- Critério de quem tem direito à carta de aceite, por edição (Submissões ›
-- Carta de aceite › Critério). O padrão é o combinado com a organização: os
-- três aprovados, ressalvas/formatação só com a correção concluída.

-- AlterTable
ALTER TABLE "edicoes"
  ADD COLUMN "cartaAceiteDecisoes" "DecisaoAvaliacao"[] DEFAULT ARRAY['APROVADO', 'APROVADO_COM_RESSALVAS', 'APROVADO_FORMATACAO']::"DecisaoAvaliacao"[],
  ADD COLUMN "cartaAceiteExigirCorrecao" BOOLEAN NOT NULL DEFAULT true;
