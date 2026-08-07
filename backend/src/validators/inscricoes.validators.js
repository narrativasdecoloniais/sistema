const { z } = require("zod");
const { cpfValido, apenasDigitos } = require("../utils/cpf");

const cpfLookupSchema = z.object({
  cpf: z.string().transform(apenasDigitos).refine(cpfValido, "CPF inválido"),
});

const confirmarEmailExistenteSchema = z.object({
  cpf: z.string().transform(apenasDigitos).refine(cpfValido, "CPF inválido"),
  email: z.string().trim().email("E-mail inválido"),
});

const cadastroInscricaoSchema = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo"),
  email: z.string().trim().email("E-mail inválido"),
  cpf: z.string().transform(apenasDigitos).refine(cpfValido, "CPF inválido"),
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
});

const selecionarAtividadesSchema = z.object({
  atividadeIds: z.array(z.string().uuid()),
});

module.exports = {
  cpfLookupSchema,
  confirmarEmailExistenteSchema,
  cadastroInscricaoSchema,
  selecionarAtividadesSchema,
};
