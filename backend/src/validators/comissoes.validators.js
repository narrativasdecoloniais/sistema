const { z } = require("zod");

const comissaoMembroSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(2, "Informe o nome do integrante"),
});

const comissaoSchema = z.object({
  tipoComissaoId: z.string().uuid("Selecione um tipo de comissão válido"),
  membros: z.array(comissaoMembroSchema).optional(),
});

module.exports = { comissaoSchema, comissaoMembroSchema };
