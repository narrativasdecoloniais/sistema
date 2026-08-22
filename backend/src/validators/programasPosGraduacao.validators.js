const { z } = require("zod");

const programaPosGraduacaoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do programa"),
  link: z.string().trim().url("Link inválido").optional(),
  imagem: z
    .string()
    .refine((valor) => valor.startsWith("data:image/"), "Imagem inválida")
    .nullable()
    .optional(),
});

module.exports = { programaPosGraduacaoSchema };
