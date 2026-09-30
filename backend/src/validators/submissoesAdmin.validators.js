const { z } = require("zod");
const { criarSubmissaoSchema } = require("./submissoes.validators");

// Inserção pela organização, sem declaração de aceite (quem declara é o
// autor). O autor principal é uma conta escolhida na busca (usuarioId) ou,
// para quem não tem conta, nome + e-mail — no molde do convite de avaliador.
// Referência pode ficar vazia pelo mesmo motivo do editor abaixo.
const criarSubmissaoAdminSchema = criarSubmissaoSchema
  .omit({ aceiteDeclaracao: true })
  .extend({
    usuarioId: z.string().uuid("Selecione o autor principal").optional(),
    nome: z.string().trim().optional(),
    email: z.string().trim().optional(),
    referenciaBibliografica: z.string().trim().default(""),
  })
  .superRefine((dados, ctx) => {
    if (dados.usuarioId) return;
    if (!dados.nome || dados.nome.length < 3) {
      ctx.addIssue({ code: "custom", path: ["nome"], message: "Informe o nome completo" });
    }
    if (!dados.email || !z.string().email().safeParse(dados.email).success) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "E-mail inválido" });
    }
  });

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

module.exports = { criarSubmissaoAdminSchema, conteudoSubmissaoSchema, imagemSubmissaoSchema, areaSubmissaoAdminSchema };
