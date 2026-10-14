-- Carta de aceite dos trabalhos aprovados, como um tipo de certificado (uma
-- por submissão, em nome do autor principal), com o critério de quem tem
-- direito configurável por edição.

-- AlterEnum
ALTER TYPE "TipoCertificado" ADD VALUE 'CARTA_ACEITE';

-- AlterTable: o padrão é o critério combinado com a organização (os três
-- aprovados, ressalvas/formatação só com a correção concluída).
ALTER TABLE "edicoes"
  ADD COLUMN "cartaAceiteDecisoes" "DecisaoAvaliacao"[] DEFAULT ARRAY['APROVADO', 'APROVADO_COM_RESSALVAS', 'APROVADO_FORMATACAO']::"DecisaoAvaliacao"[],
  ADD COLUMN "cartaAceiteExigirCorrecao" BOOLEAN NOT NULL DEFAULT true;
