const { z } = require("zod");

// Espelhados em frontend/lib/validacao.js.
const textoEmailSchema = {
  assunto: z.string().trim().min(3, "Informe o assunto").max(200, "Máximo de 200 caracteres"),
  corpo: z.string().trim().min(1, "Escreva o texto do e-mail"),
};

const modeloEmailSchema = z.object({
  nome: z.string().trim().min(3, "Informe um nome para o modelo").max(120, "Máximo de 120 caracteres"),
  ...textoEmailSchema,
});

const testeEmailSchema = z.object({
  ...textoEmailSchema,
  edicaoId: z.string().uuid().optional(),
});

const envioEmailSchema = z.object({
  ...textoEmailSchema,
  edicaoId: z.string().uuid("Edição inválida"),
  modeloId: z.string().uuid().nullable().optional(),
  usuarioIds: z.array(z.string().uuid()).min(1, "Selecione ao menos um destinatário"),
});

module.exports = { modeloEmailSchema, testeEmailSchema, envioEmailSchema };
