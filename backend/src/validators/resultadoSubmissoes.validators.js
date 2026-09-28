const { z } = require("zod");

const DECISOES = ["APROVADO", "APROVADO_COM_RESSALVAS", "APROVADO_FORMATACAO", "REPROVADO"];

const observacaoSchema = z.object({
  observacao: z.string().trim().max(5000, "Máximo de 5000 caracteres").default(""),
});

// Prazo é só dia ("YYYY-MM-DD"), gravado como meia-noite UTC — mesma
// convenção ingênua dos prazos de modalidade (ver utils/prazoCorrecao.js).
const prazoSchema = z.object({
  prazo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .transform((valor) => new Date(`${valor}T00:00:00.000Z`))
    .nullable(),
});

const conferirCorrecaoSchema = z
  .object({
    aceitar: z.boolean(),
    motivo: z.string().trim().max(5000, "Máximo de 5000 caracteres").optional().default(""),
  })
  .refine((dados) => dados.aceitar || dados.motivo.length >= 3, {
    message: "Explique o que ainda precisa ser corrigido",
    path: ["motivo"],
  });

const decisaoParamSchema = z.enum(DECISOES, { errorMap: () => ({ message: "Decisão inválida" }) });

const modeloEmailSchema = z.object({
  assunto: z.string().trim().min(3, "Informe o assunto").max(200, "Máximo de 200 caracteres"),
  corpo: z.string().trim().min(1, "Informe o texto do e-mail"),
});

module.exports = { observacaoSchema, prazoSchema, conferirCorrecaoSchema, decisaoParamSchema, modeloEmailSchema };
