const { z } = require("zod");

// Inscrição só pela área do participante (logado) — o fluxo público com
// identificação por CPF + e-mail foi removido por não comprovar a posse do
// e-mail.
const selecionarAtividadesSchema = z.object({
  atividadeIds: z.array(z.string().uuid()),
});

module.exports = {
  selecionarAtividadesSchema,
};
