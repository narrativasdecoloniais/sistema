const { z } = require("zod");

const organizadorSchema = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo"),
  email: z.string().trim().email("E-mail inválido"),
});

module.exports = { organizadorSchema };
