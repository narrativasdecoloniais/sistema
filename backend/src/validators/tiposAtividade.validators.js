const { z } = require("zod");

const tipoAtividadeSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do tipo de atividade"),
});

module.exports = { tipoAtividadeSchema };
