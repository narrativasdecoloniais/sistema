const { z } = require("zod");

const tipoParticipacaoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do tipo de participação"),
  // Nulo/ausente = sem ordem definida (renderiza como antes da coluna existir).
  ordem: z
    .number({ invalid_type_error: "Informe um número inteiro" })
    .int("Informe um número inteiro")
    .min(1, "A ordem deve ser 1 ou maior")
    .nullable()
    .optional(),
});

module.exports = { tipoParticipacaoSchema };
