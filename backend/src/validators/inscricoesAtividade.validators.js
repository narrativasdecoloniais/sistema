const { z } = require("zod");

const STATUS = ["CONFIRMADA", "LISTA_ESPERA"];

const criarInscricaoAtividadeSchema = z.object({
  usuarioId: z.string().uuid("Selecione um usuário válido"),
  atividadeId: z.string().uuid("Selecione uma atividade válida"),
  status: z.enum(STATUS, { errorMap: () => ({ message: "Status inválido" }) }).default("CONFIRMADA"),
});

const atualizarInscricaoAtividadeSchema = z.object({
  status: z.enum(STATUS, { errorMap: () => ({ message: "Status inválido" }) }),
});

const excluirInscricoesAtividadeEmLoteSchema = z.object({
  ids: z
    .array(z.string().uuid("Inscrição inválida"))
    .min(1, "Selecione ao menos uma inscrição")
    .max(2000, "Selecione no máximo 2000 inscrições por vez")
    .transform((ids) => [...new Set(ids)]),
});

module.exports = {
  criarInscricaoAtividadeSchema,
  atualizarInscricaoAtividadeSchema,
  excluirInscricoesAtividadeEmLoteSchema,
};
