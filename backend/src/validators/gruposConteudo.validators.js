const { z } = require("zod");

const itemConteudoSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(1, "Informe o nome do item"),
  imagem: z
    .string()
    .refine((valor) => valor.startsWith("data:image/"), "Imagem inválida")
    .nullable()
    .optional(),
  link: z.string().trim().url("Link inválido").optional().or(z.literal("")),
});

const listaConteudoSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(1, "Informe o nome da lista"),
  itens: z.array(itemConteudoSchema).optional(),
});

const grupoConteudoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do grupo"),
  listas: z.array(listaConteudoSchema).optional(),
});

module.exports = { grupoConteudoSchema, listaConteudoSchema, itemConteudoSchema };
