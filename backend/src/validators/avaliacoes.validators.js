const { z } = require("zod");

const DECISOES = ["APROVADO", "APROVADO_COM_RESSALVAS", "APROVADO_FORMATACAO", "REPROVADO"];
const decisaoEnum = z.enum(DECISOES, { errorMap: () => ({ message: "Decisão inválida" }) });

const areaIdsSchema = z
  .array(z.string().uuid("Área inválida"))
  .default([])
  .transform((ids) => [...new Set(ids)]);

// Conta existente (usuarioId, via busca) OU convite por e-mail (nome+email).
const adicionarAvaliadorSchema = z
  .object({
    usuarioId: z.string().uuid("Selecione um usuário válido").optional(),
    nome: z.string().trim().optional(),
    email: z.string().trim().optional(),
    areaIds: areaIdsSchema,
  })
  .superRefine((dados, ctx) => {
    if (dados.usuarioId) return;
    if (!dados.nome || dados.nome.length < 3) {
      ctx.addIssue({ code: "custom", path: ["nome"], message: "Informe o nome completo" });
    }
    if (!dados.email || !z.string().email().safeParse(dados.email).success) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Informe um e-mail válido" });
    }
  });

const atualizarAvaliadorSchema = z.object({ areaIds: areaIdsSchema });

const atribuirAvaliadorSchema = z.object({
  avaliadorEdicaoId: z.string().uuid("Selecione um avaliador"),
  submissaoIds: z
    .array(z.string().uuid("Submissão inválida"))
    .min(1, "Selecione ao menos uma submissão")
    .max(2000, "Selecione no máximo 2000 submissões por vez")
    .transform((ids) => [...new Set(ids)]),
});

const decisaoFinalSchema = z.object({ decisao: decisaoEnum.nullable() });

const resolverSugestaoSchema = z.object({ aprovar: z.boolean() });

const decisaoAvaliadorSchema = z.object({ decisao: decisaoEnum });

const sugestaoAreaSchema = z.object({
  areaSugeridaId: z.string().uuid("Selecione a área sugerida"),
  justificativa: z.string().trim().max(2000, "Máximo de 2000 caracteres").optional().default(""),
});

module.exports = {
  DECISOES,
  adicionarAvaliadorSchema,
  atualizarAvaliadorSchema,
  atribuirAvaliadorSchema,
  decisaoFinalSchema,
  resolverSugestaoSchema,
  decisaoAvaliadorSchema,
  sugestaoAreaSchema,
};
