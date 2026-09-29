const { z } = require("zod");
const { SecaoAdmin } = require("@prisma/client");

// Vem do enum SecaoAdmin do schema (via Prisma Client), pra nunca ficar
// desatualizado quando uma seção nova é criada.
const SECOES_ADMIN = Object.values(SecaoAdmin);

const permissoesSchema = z.object({
  acessoCompleto: z.boolean().default(false),
  secoesPermitidas: z
    .array(z.enum(SECOES_ADMIN, { errorMap: () => ({ message: "Seção inválida" }) }))
    .default([]),
});

const organizadorSchema = z
  .object({
    nome: z.string().trim().min(3, "Informe o nome completo"),
    email: z.string().trim().email("E-mail inválido"),
  })
  .merge(permissoesSchema);

module.exports = { organizadorSchema, permissoesSchema };
