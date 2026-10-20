const { z } = require("zod");

const tipoPontoInteresseSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do tipo de ponto de referência"),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
  ordem: z.number().int("Use um número inteiro").min(0, "Use um número a partir de 0").nullable().optional(),
});

module.exports = { tipoPontoInteresseSchema };
