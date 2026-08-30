const { z } = require("zod");

const SECOES_ADMIN = [
  "ATIVIDADES",
  "PAGINA_EVENTO",
  "PAGINA_APRESENTACAO",
  "PAGINA_MODALIDADES",
  "PAGINA_AGENDA",
  "PAGINA_PUBLICACOES",
  "PAGINA_REALIZADORES",
  "PROGRAMACAO",
  "SUBMISSOES_RECEBIMENTO",
  "SUBMISSOES_AVALIACAO",
  "SUBMISSOES_RESULTADO",
  "SUBMISSOES_APRESENTACAO",
  "SUBMISSOES_PUBLICACAO",
  "INSCRICOES_GERAIS",
  "INSCRICOES_ATIVIDADES",
  "CREDENCIAMENTO",
  "CERTIFICADOS",
  "PARTICIPANTES",
  "CONFIGURACOES_EVENTO",
  "TIPOS_ATIVIDADE",
  "TIPOS_PARTICIPACAO",
  "TIPOS_PONTO_INTERESSE",
];

const permissoesSchema = z.object({
  acessoCompleto: z.boolean().default(false),
  secoesPermitidas: z
    .array(z.enum(SECOES_ADMIN, { errorMap: () => ({ message: "Seção inválida" }) }))
    .default([]),
});

const organizadorSchema = z
  .object({
    nome: z.string().trim().min(3, "Informe o nome completo"),
    email: z.string().trim().email("E-mail inválido"),
  })
  .merge(permissoesSchema);

module.exports = { organizadorSchema, permissoesSchema };
