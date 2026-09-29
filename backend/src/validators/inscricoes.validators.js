const { z } = require("zod");

// Inscrição só pela área do participante (logado) — o fluxo público com
// identificação por CPF + e-mail foi removido por não comprovar a posse do
// e-mail.

// Pergunta de acessibilidade da inscrição geral. Espelhada em
// frontend/lib/validacao.js (adaptacaoInscricaoSchema) — mudou um, muda o outro.
const MAX_ADAPTACOES = 2000;

const camposAdaptacao = {
  precisaAdaptacao: z.boolean({
    required_error: "Responda se você necessita de alguma adaptação ou recurso",
    invalid_type_error: "Responda se você necessita de alguma adaptação ou recurso",
  }),
  adaptacoesNecessarias: z
    .string()
    .trim()
    .max(MAX_ADAPTACOES, `Use no máximo ${MAX_ADAPTACOES} caracteres`)
    .nullish(),
};

function validarAdaptacao(dados, ctx) {
  if (dados.precisaAdaptacao === true && !dados.adaptacoesNecessarias) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["adaptacoesNecessarias"],
      message: "Indique as adaptações ou recursos de que você necessita",
    });
  }
}

// "Não" descarta um texto que tenha sobrado de uma resposta anterior.
function normalizarAdaptacao({ precisaAdaptacao, adaptacoesNecessarias }) {
  return {
    precisaAdaptacao,
    adaptacoesNecessarias: precisaAdaptacao ? adaptacoesNecessarias : null,
  };
}

const adaptacaoSchema = z.object(camposAdaptacao).superRefine(validarAdaptacao).transform(normalizarAdaptacao);

// `adaptacao` só é exigida quando a inscrição geral ainda não existe (ver
// participanteInscricoes.service.js); ao adicionar atividades depois, vem vazia.
const selecionarAtividadesSchema = z.object({
  atividadeIds: z.array(z.string().uuid()),
  adaptacao: adaptacaoSchema.optional(),
});

module.exports = {
  adaptacaoSchema,
  selecionarAtividadesSchema,
  // Reaproveitados pela inscrição na monitoria (monitoria.validators.js).
  camposAdaptacao,
  validarAdaptacao,
};
