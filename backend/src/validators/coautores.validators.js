const { z } = require("zod");

// "Já tenho conta" do convite de coautor.
const vincularConviteSchema = z.object({
  token: z.string().trim().min(1, "Convite inválido").max(200),
});

// Tela admin de Coautores.
const atualizarCoautorSchema = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo").max(300),
  email: z.string().trim().email("E-mail inválido"),
});

const vincularCoautorSchema = z.object({
  usuarioId: z.string().uuid("Selecione uma conta"),
});

const enviarConvitesSchema = z.object({
  autorIds: z.array(z.string().uuid()).min(1, "Selecione ao menos um coautor").max(1000),
});

module.exports = {
  vincularConviteSchema,
  atualizarCoautorSchema,
  vincularCoautorSchema,
  enviarConvitesSchema,
};
