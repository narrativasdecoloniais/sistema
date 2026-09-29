const { z } = require("zod");

// Edição pela organização (editor em tela cheia). Referência pode ficar
// vazia — trabalhos importados do Even3 às vezes chegaram sem ela.
const conteudoSubmissaoSchema = z.object({
  titulo: z.string().trim().min(3, "Informe o título do trabalho").max(500, "Máximo de 500 caracteres"),
  resumo: z.string().trim().min(1, "Informe o resumo"),
  referenciaBibliografica: z.string().trim().default(""),
  versaoBase: z.string().datetime({ message: "Versão inválida — recarregue a página" }),
});

const imagemSubmissaoSchema = z.object({
  imagem: z.string().min(1, "Envie uma imagem"),
});

const areaSubmissaoAdminSchema = z.object({
  areaSubmissaoId: z.string().min(1, "Selecione a área"),
});

module.exports = { conteudoSubmissaoSchema, imagemSubmissaoSchema, areaSubmissaoAdminSchema };
