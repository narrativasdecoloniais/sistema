const { z } = require("zod");
const { camposIdentificacao, validarIdentificacao } = require("./identificacao.validators");

// Regularização pública de cadastro (temporária, edição V) — ver
// services/regularizacaoContas.service.js.
const buscaRegularizacaoSchema = z.object({
  nome: z.string().trim().min(5, "Digite seu nome completo").max(200),
});

const camposPlano = {
  contaIds: z
    .array(z.string().uuid("Conta inválida"))
    .min(1, "Selecione a sua conta")
    .max(2, "Selecione no máximo duas contas")
    .refine((ids) => new Set(ids).size === ids.length, "Selecione contas diferentes"),
  ...camposIdentificacao,
  manterId: z.string().uuid().optional(),
};

const planoRegularizacaoSchema = z.object(camposPlano).superRefine(validarIdentificacao);

const confirmarRegularizacaoSchema = z
  .object({
    ...camposPlano,
    codigos: z.record(z.string().trim().min(6, "Informe o código enviado por e-mail")),
  })
  .superRefine(validarIdentificacao);

module.exports = { buscaRegularizacaoSchema, planoRegularizacaoSchema, confirmarRegularizacaoSchema };
