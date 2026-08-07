const { z } = require("zod");

const tipoParticipacaoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do tipo de participação"),
});

module.exports = { tipoParticipacaoSchema };
