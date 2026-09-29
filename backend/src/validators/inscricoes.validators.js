const { z } = require("zod");
const { camposIdentificacao, validarIdentificacao } = require("./identificacao.validators");

// Todas as etapas identificam a pessoa por CPF ou, para estrangeiros, por
// documento + país (ver identificacao.validators.js).
const cpfLookupSchema = z.object({ ...camposIdentificacao }).superRefine(validarIdentificacao);

const confirmarEmailExistenteSchema = z
  .object({
    ...camposIdentificacao,
    email: z.string().trim().email("E-mail inválido"),
  })
  .superRefine(validarIdentificacao);

const cadastroInscricaoSchema = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo"),
  email: z.string().trim().email("E-mail inválido"),
  ...camposIdentificacao,
  instituicao: z.string().trim().min(2, "Informe a instituição"),
  categoria: z.enum(["ESTUDANTE", "DOCENTE", "PESQUISADOR", "COMUNIDADE_EXTERNA"], {
    errorMap: () => ({ message: "Categoria inválida" }),
  }),
  aceiteTermos: z.literal(true, {
    errorMap: () => ({ message: "É necessário aceitar os termos de uso" }),
  }),
  aceitePrivacidade: z.literal(true, {
    errorMap: () => ({ message: "É necessário aceitar a política de privacidade" }),
  }),
}).superRefine(validarIdentificacao);

const vinculoSolicitarSchema = z
  .object({
    ...camposIdentificacao,
    email: z.string().trim().email("E-mail inválido"),
  })
  .superRefine(validarIdentificacao);

const vinculoConfirmarSchema = z.object({
  ...camposIdentificacao,
  email: z.string().trim().email("E-mail inválido"),
  codigo: z.string().trim().min(6, "Informe o código enviado por e-mail"),
  aceiteTermos: z.literal(true, {
    errorMap: () => ({ message: "É necessário aceitar os termos de uso" }),
  }),
  aceitePrivacidade: z.literal(true, {
    errorMap: () => ({ message: "É necessário aceitar a política de privacidade" }),
  }),
}).superRefine(validarIdentificacao);

const selecionarAtividadesSchema = z.object({
  atividadeIds: z.array(z.string().uuid()),
});

module.exports = {
  cpfLookupSchema,
  confirmarEmailExistenteSchema,
  cadastroInscricaoSchema,
  vinculoSolicitarSchema,
  vinculoConfirmarSchema,
  selecionarAtividadesSchema,
};
