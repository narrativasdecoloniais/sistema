const { z } = require("zod");

const areaSubmissaoSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  titulo: z.string().trim().min(3, "Informe o título da área"),
  descricao: z.string().trim().optional(),
  atividadeIds: z.array(z.string().uuid()).optional().default([]),
});

const modalidadeSubmissaoSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
    nome: z.string().trim().min(3, "Informe o nome da modalidade"),
    subtitulo: z.string().trim().optional(),
    prazoInicio: z.coerce.date({
      errorMap: () => ({ message: "Informe uma data de início válida" }),
    }),
    prazoFim: z.coerce.date({
      errorMap: () => ({ message: "Informe uma data de término válida" }),
    }),
    resumoCurto: z.string().trim().min(1, "Informe o resumo curto"),
    perguntaTitulo: z.string().trim().min(1, "Informe o título da seção de descrição"),
    descricao: z.string().trim().optional(),
    linkRotulo: z.string().trim().optional(),
    rotuloItem: z.string().trim().optional(),
    areas: z.array(areaSubmissaoSchema).optional(),
  })
  .refine((dados) => dados.prazoFim > dados.prazoInicio, {
    message: "O prazo final deve ser posterior ao início",
    path: ["prazoFim"],
  })
  .refine(
    (dados) => !dados.areas || new Set(dados.areas.map((area) => area.slug)).size === dados.areas.length,
    { message: "As áreas não podem repetir o mesmo slug", path: ["areas"] }
  );

module.exports = { modalidadeSubmissaoSchema };
