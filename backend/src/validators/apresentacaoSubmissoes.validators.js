const { z } = require("zod");

const listaIds = z
  .array(z.string().uuid("Submissão inválida"))
  .min(1, "Selecione ao menos um trabalho")
  .max(2000, "Selecione no máximo 2000 trabalhos por vez")
  .transform((ids) => [...new Set(ids)]);

const vincularSchema = z.object({
  atividadeId: z.string().uuid("Selecione uma atividade"),
  submissaoIds: listaIds,
});

const desvincularSchema = z.object({ submissaoIds: listaIds });

// Lista completa, na nova ordem — sem transform, repetição vira 400 no service.
const reordenarSchema = z.object({
  submissaoIds: z.array(z.string().uuid("Submissão inválida")).min(1).max(2000),
});

const distribuirSchema = z.object({ simular: z.boolean().default(false) });

const publicacaoSchema = z.object({ publicar: z.boolean() });

// Espelhado em modeloEmailApresentacaoSchema (frontend/lib/validacao.js).
const modeloEmailSchema = z.object({
  assunto: z.string().trim().min(3, "Informe o assunto").max(200, "Máximo de 200 caracteres"),
  corpo: z.string().trim().min(1, "Informe o texto do e-mail"),
});

module.exports = {
  vincularSchema,
  desvincularSchema,
  reordenarSchema,
  distribuirSchema,
  publicacaoSchema,
  modeloEmailSchema,
};
