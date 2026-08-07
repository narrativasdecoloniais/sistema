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

module.exports = { criarInscricaoAtividadeSchema, atualizarInscricaoAtividadeSchema };
