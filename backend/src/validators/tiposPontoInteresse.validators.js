const { z } = require("zod");

const tipoPontoInteresseSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do tipo de ponto de referência"),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
});

module.exports = { tipoPontoInteresseSchema };
