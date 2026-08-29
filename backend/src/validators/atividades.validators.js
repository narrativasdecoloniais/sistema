const { z } = require("zod");

// Mesma paleta/regex de edicoes.validators.js — duplicado aqui de propósito
// (não há um módulo compartilhado de cores no backend, ver PALETA_PUBLICA em
// frontend/lib/cores.js, que também é duplicada em vez de centralizada).
const CORES_PUBLICAS = ["TINTA", "BARRO", "OCRE", "BUZIO", "AREIA", "PAPEL", "CERRADO"];
const CORES_HEX_REGEX = /^#[0-9a-fA-F]{6}$/;
const corPublicaSchema = z
  .union([z.enum(CORES_PUBLICAS), z.string().regex(CORES_HEX_REGEX)], {
    errorMap: () => ({ message: "Cor inválida" }),
  })
  .optional();
const corSecaoSchema = corPublicaSchema;
const opacidadeSchema = z.coerce
  .number({ invalid_type_error: "Informe uma opacidade válida" })
  .int("Informe uma opacidade válida")
  .min(0, "A opacidade deve estar entre 0 e 100")
  .max(100, "A opacidade deve estar entre 0 e 100")
  .optional();

const atividadePessoaSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(2, "Informe o nome da pessoa"),
  imagem: z
    .string()
    .refine((valor) => valor.startsWith("data:image/"), "Imagem inválida")
    .nullable()
    .optional(),
  descricao: z.string().trim().max(2000, "A descrição deve ter no máximo 2000 caracteres").optional(),
  breveDescricao: z.string().trim().max(200, "A breve descrição deve ter no máximo 200 caracteres").optional(),
  tipoParticipacaoId: z
    .string()
    .uuid("Selecione um tipo de participação válido")
    .nullable()
    .optional(),
});

const atividadeSchema = z
  .object({
    tipoAtividadeId: z.string().uuid("Selecione um tipo de atividade válido"),
    nome: z.string().trim().min(3, "Informe o nome da atividade"),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
    descricao: z.string().trim().optional(),
    cargaHoraria: z.coerce
      .number({ invalid_type_error: "Informe uma carga horária válida" })
      .int("Informe uma carga horária válida")
      .positive("Informe uma carga horária válida")
      .optional(),
    local: z.string().trim().optional(),
    pessoas: z.array(atividadePessoaSchema).optional(),
    exigeInscricao: z.boolean().optional().default(true),
    semLimiteVagas: z.boolean().optional().default(false),
    vagas: z.coerce
      .number({ invalid_type_error: "Informe uma quantidade de vagas válida" })
      .int("Informe uma quantidade de vagas válida")
      .positive("Informe uma quantidade de vagas válida")
      .nullable()
      .optional(),
    inicioAtividade: z.coerce.date({
      errorMap: () => ({ message: "Informe uma data de início da atividade válida" }),
    }),
    fimAtividade: z.coerce.date({
      errorMap: () => ({ message: "Informe uma data de término da atividade válida" }),
    }),
    corFundoAtividade: corSecaoSchema,
    opacidadeFundoAtividade: opacidadeSchema,
    corTextoAtividade: corPublicaSchema,
    corBuzioAtividade: corPublicaSchema,
    mostrarFaixaAtividade: z.boolean().optional(),
  })
  .refine((dados) => dados.fimAtividade > dados.inicioAtividade, {
    message: "O fim da atividade deve ser posterior ao início",
    path: ["fimAtividade"],
  })
  .refine((dados) => !dados.exigeInscricao || dados.semLimiteVagas || dados.vagas != null, {
    message: "Informe a quantidade de vagas ou marque sem limite",
    path: ["vagas"],
  });

const atividadeHorarioSchema = z
  .object({
    inicioAtividade: z.coerce.date({
      errorMap: () => ({ message: "Informe uma data de início da atividade válida" }),
    }),
    fimAtividade: z.coerce.date({
      errorMap: () => ({ message: "Informe uma data de término da atividade válida" }),
    }),
  })
  .refine((dados) => dados.fimAtividade > dados.inicioAtividade, {
    message: "O fim da atividade deve ser posterior ao início",
    path: ["fimAtividade"],
  });

module.exports = { atividadeSchema, atividadeHorarioSchema };
