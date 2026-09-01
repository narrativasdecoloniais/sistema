const { z } = require("zod");

const emailSubmissaoSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  destino: z.string().trim().min(1, "Destino inválido"),
});

const cadastroSubmissaoSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  nome: z.string().trim().min(3, "Informe o nome completo"),
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
  destino: z.string().trim().min(1, "Destino inválido"),
});

const entrarSubmissaoSchema = z.object({
  token: z.string().trim().min(1, "Link inválido"),
});

const verificarEmailAutorSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
});

const coautorSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do autor"),
  email: z.string().trim().email("E-mail inválido"),
  orcid: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/, "ORCID inválido")
    .optional()
    .or(z.literal("")),
});

const criarSubmissaoSchema = z.object({
  modalidadeSubmissaoId: z.string().uuid("Selecione a modalidade"),
  areaSubmissaoId: z.string().uuid().optional(),
  titulo: z.string().trim().min(3, "Informe o título do trabalho").max(500),
  resumo: z.string().trim().min(1, "Informe o resumo"),
  referenciaBibliografica: z.string().trim().min(1, "Informe a referência bibliográfica"),
  coautores: z.array(coautorSchema).max(20, "No máximo 20 coautores").default([]),
  aceiteDeclaracao: z.literal(true, {
    errorMap: () => ({ message: "É necessário declarar concordância com as regras de submissão" }),
  }),
});

module.exports = {
  emailSubmissaoSchema,
  cadastroSubmissaoSchema,
  entrarSubmissaoSchema,
  verificarEmailAutorSchema,
  criarSubmissaoSchema,
};
