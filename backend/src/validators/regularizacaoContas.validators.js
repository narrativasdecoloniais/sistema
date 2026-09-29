const { z } = require("zod");
const { cpfValido, apenasDigitos } = require("../utils/cpf");

// Regularização pública de cadastro (temporária, edição V) — ver
// services/regularizacaoContas.service.js.
const buscaRegularizacaoSchema = z.object({
  nome: z.string().trim().min(5, "Digite seu nome completo").max(200),
});

const planoRegularizacaoSchema = z.object({
  contaIds: z
    .array(z.string().uuid("Conta inválida"))
    .min(1, "Selecione a sua conta")
    .max(2, "Selecione no máximo duas contas")
    .refine((ids) => new Set(ids).size === ids.length, "Selecione contas diferentes"),
  cpf: z.string().transform(apenasDigitos).refine(cpfValido, "CPF inválido"),
  manterId: z.string().uuid().optional(),
});

const confirmarRegularizacaoSchema = planoRegularizacaoSchema.extend({
  codigos: z.record(z.string().trim().min(6, "Informe o código enviado por e-mail")),
});

module.exports = { buscaRegularizacaoSchema, planoRegularizacaoSchema, confirmarRegularizacaoSchema };
