const { z } = require("zod");
const { normalizarIssn, normalizarIsbn } = require("../utils/validarIssnIsbn");

// Espelhado em frontend/lib/validacao.js (anaisConfiguracaoSchema) — campo
// novo aqui precisa ir pra lá também.

const LICENCAS = ["CC_BY", "CC_BY_SA", "CC_BY_NC", "CC_BY_NC_SA", "CC_BY_ND", "CC_BY_NC_ND", "TODOS_DIREITOS_RESERVADOS"];

// "" / só espaços viram null (campo opcional apagado no formulário).
function textoOpcional(maximo, mensagem) {
  return z.preprocess(
    (valor) => (typeof valor === "string" && valor.trim() === "" ? null : valor),
    z.string().trim().max(maximo, mensagem).nullish().transform((valor) => valor ?? null)
  );
}

const anaisConfiguracaoSchema = z.object({
  titulo: z.string().trim().min(3, "Informe o título dos Anais").max(300, "Use no máximo 300 caracteres"),
  subtitulo: textoOpcional(300, "Use no máximo 300 caracteres"),
  nomeEvento: textoOpcional(300, "Use no máximo 300 caracteres"),
  issn: textoOpcional(20, "ISSN inválido").transform((valor, ctx) => {
    if (!valor) return null;
    const normalizado = normalizarIssn(valor);
    if (!normalizado) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ISSN inválido — confira os 8 dígitos (ex. 1234-5679)" });
      return z.NEVER;
    }
    return normalizado;
  }),
  isbn: textoOpcional(30, "ISBN inválido").transform((valor, ctx) => {
    if (!valor) return null;
    const normalizado = normalizarIsbn(valor);
    if (!normalizado) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ISBN inválido — confira os 10 ou 13 dígitos" });
      return z.NEVER;
    }
    return normalizado;
  }),
  editora: textoOpcional(200, "Use no máximo 200 caracteres"),
  localPublicacao: textoOpcional(120, "Use no máximo 120 caracteres"),
  anoPublicacao: z.preprocess(
    (valor) => (valor === "" || valor === undefined ? null : valor),
    z.coerce
      .number({ invalid_type_error: "Informe um ano válido" })
      .int("Informe um ano válido")
      .min(1900, "Informe um ano válido")
      .max(2200, "Informe um ano válido")
      .nullable()
  ),
  organizadores: z
    .array(z.string().trim().min(1, "Preencha o nome").max(200, "Use no máximo 200 caracteres"))
    .max(30, "Cadastre no máximo 30 pessoas")
    .default([]),
  licenca: z.enum(LICENCAS, { errorMap: () => ({ message: "Licença inválida" }) }),
  // Limite do texto visível em sanitizarApresentacaoAnais.js.
  apresentacao: z.string().max(300000, "A apresentação está grande demais").nullish(),
  fichaCatalografica: textoOpcional(4000, "Use no máximo 4000 caracteres"),
  gruposConteudoIds: z.array(z.string().uuid()).max(50).default([]),
});

const publicacaoSchema = z.object({ publicado: z.boolean() });

const ocultacaoArtigosSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Selecione ao menos um trabalho").max(2000),
  oculto: z.boolean(),
});

const ocultacaoComentarioSchema = z.object({ oculto: z.boolean() });

const formatoArquivoSchema = z.enum(["pdf", "docx"], { errorMap: () => ({ message: "Formato inválido" }) });

const comentarioSchema = z.object({
  texto: z
    .string()
    .trim()
    .min(2, "Escreva o comentário")
    .max(2000, "O comentário pode ter no máximo 2000 caracteres")
    .transform((texto) => texto.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n")),
  respostaAId: z.string().uuid().nullish(),
});

module.exports = {
  LICENCAS,
  anaisConfiguracaoSchema,
  publicacaoSchema,
  ocultacaoArtigosSchema,
  ocultacaoComentarioSchema,
  formatoArquivoSchema,
  comentarioSchema,
};
