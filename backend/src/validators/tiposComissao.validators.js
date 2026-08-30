const { z } = require("zod");

const tipoComissaoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do tipo de comissão"),
});

module.exports = { tipoComissaoSchema };
