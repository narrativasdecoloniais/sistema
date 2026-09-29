const { z } = require("zod");
const { camposAdaptacao, validarAdaptacao } = require("./inscricoes.validators");

// Espelhado em frontend/lib/validacao.js (criarInscricaoMonitoriaSchema etc.)
// — mudou um, muda o outro.

const TIPOS_AUTORIZACAO = ["application/pdf", "image/png", "image/jpeg"];
const TAMANHO_MAX_AUTORIZACAO = 5 * 1024 * 1024;
const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;

// Idade completa em `referencia` (datas "ingênuas": só componentes UTC).
function idadeEm(dataNascimentoIso, referencia) {
  const nascimento = new Date(dataNascimentoIso);
  const ref = new Date(referencia);
  let idade = ref.getUTCFullYear() - nascimento.getUTCFullYear();
  const aniversarioAindaNaoChegou =
    ref.getUTCMonth() < nascimento.getUTCMonth() ||
    (ref.getUTCMonth() === nascimento.getUTCMonth() && ref.getUTCDate() < nascimento.getUTCDate());
  if (aniversarioAindaNaoChegou) idade -= 1;
  return idade;
}

// Tamanho real do arquivo codificado em base64 dentro do data URI.
function tamanhoDataUri(dataUri) {
  const base64 = dataUri.slice(dataUri.indexOf(",") + 1);
  return Math.floor((base64.length * 3) / 4);
}

const autorizacaoSchema = z
  .string()
  .refine(
    (valor) => TIPOS_AUTORIZACAO.some((tipo) => valor.startsWith(`data:${tipo};base64,`)),
    "Envie a autorização em PDF, JPG ou PNG"
  )
  .refine((valor) => tamanhoDataUri(valor) <= TAMANHO_MAX_AUTORIZACAO, "O arquivo deve ter no máximo 5MB");

const ciente = (mensagem) => z.literal(true, { errorMap: () => ({ message: mensagem }) });

// Monta o schema com o contexto da edição: `funcoesPermitidas` é
// Edicao.funcoesMonitoria, `dataReferencia` é o início do evento (a idade
// conta nesse dia) e `temAutorizacaoSalva` evita exigir reenvio ao editar.
function criarInscricaoMonitoriaSchema({ funcoesPermitidas, dataReferencia, temAutorizacaoSalva = false }) {
  return z
    .object({
      dataNascimento: z
        .string({ required_error: "Informe a data de nascimento" })
        .regex(REGEX_DATA, "Informe a data de nascimento")
        .refine((valor) => !Number.isNaN(new Date(valor).getTime()), "Data de nascimento inválida")
        .refine((valor) => {
          const idade = idadeEm(valor, dataReferencia);
          return idade >= 10 && idade <= 110;
        }, "Data de nascimento inválida"),
      pronome: z
        .string({ required_error: "Informe como prefere ser tratado(a)" })
        .trim()
        .min(1, "Informe como prefere ser tratado(a)")
        .max(100, "Use no máximo 100 caracteres"),
      telefone: z
        .string({ required_error: "Informe um telefone com DDD" })
        .trim()
        .refine((valor) => {
          const digitos = valor.replace(/\D/g, "");
          return digitos.length >= 10 && digitos.length <= 13;
        }, "Informe um telefone com DDD"),
      cursoInstituicao: z
        .string({ required_error: "Informe o curso e a instituição" })
        .trim()
        .min(3, "Informe o curso e a instituição")
        .max(300, "Use no máximo 300 caracteres"),
      experienciaAnterior: z.boolean({
        required_error: "Responda se já teve experiência como monitor(a)",
        invalid_type_error: "Responda se já teve experiência como monitor(a)",
      }),
      funcoes: z
        .array(z.string(), { required_error: "Selecione ao menos uma atividade" })
        .min(1, "Selecione ao menos uma atividade")
        .refine((lista) => lista.every((funcao) => funcoesPermitidas.includes(funcao)), "Atividade inválida"),
      ...camposAdaptacao,
      cienteFormacao: ciente("Confirme que está ciente da formação de monitores"),
      cienteDisponibilidade: ciente("Confirme que está ciente da disponibilidade presencial"),
      cienteVoluntaria: ciente("Confirme que está ciente de que a monitoria é voluntária"),
      autorizacaoResponsavel: autorizacaoSchema.nullish(),
    })
    .superRefine(validarAdaptacao)
    .superRefine((dados, ctx) => {
      const menor = idadeEm(dados.dataNascimento, dataReferencia) < 18;
      if (menor && !dados.autorizacaoResponsavel && !temAutorizacaoSalva) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["autorizacaoResponsavel"],
          message: "Anexe a autorização do(a) responsável",
        });
      }
    })
    .transform((dados) => ({
      ...dados,
      funcoes: [...new Set(dados.funcoes)],
      adaptacoesNecessarias: dados.precisaAdaptacao ? dados.adaptacoesNecessarias : null,
      menor: idadeEm(dados.dataNascimento, dataReferencia) < 18,
    }));
}

const dataOpcional = (mensagem) =>
  z.preprocess(
    (valor) => (valor === "" ? null : valor),
    z.coerce.date({ errorMap: () => ({ message: mensagem }) }).nullable()
  );

const configuracaoMonitoriaSchema = z
  .object({
    inicioInscricoesMonitoria: dataOpcional("Informe uma data de início válida").optional(),
    fimInscricoesMonitoria: dataOpcional("Informe uma data de término válida").optional(),
    vagasMonitoria: z
      .preprocess(
        (valor) => (valor === "" ? null : valor),
        z.coerce
          .number({ invalid_type_error: "Informe um número de vagas válido" })
          .int("Informe um número inteiro")
          .min(1, "Informe ao menos 1 vaga")
          .max(10000, "Número de vagas muito alto")
          .nullable()
      )
      .optional(),
    funcoesMonitoria: z
      .array(z.string().trim().min(1, "Preencha o nome da atividade").max(200, "Use no máximo 200 caracteres"))
      .max(30, "Cadastre no máximo 30 atividades")
      .refine((lista) => new Set(lista).size === lista.length, "Há atividades repetidas na lista")
      .optional(),
    // Tabelas geram muito HTML; o limite do texto visível fica em
    // sanitizarEditalMonitoria.js.
    editalMonitoria: z.string().max(300000, "O edital está grande demais").nullish(),
  })
  .refine(
    (dados) =>
      !dados.inicioInscricoesMonitoria ||
      !dados.fimInscricoesMonitoria ||
      dados.fimInscricoesMonitoria > dados.inicioInscricoesMonitoria,
    { message: "O fim das inscrições deve ser depois do início", path: ["fimInscricoesMonitoria"] }
  );

const STATUS = ["EM_ANALISE", "SELECIONADO", "LISTA_ESPERA", "NAO_SELECIONADO", "CANCELADA"];

const decisaoMonitoriaSchema = z.object({
  status: z.enum(STATUS, { errorMap: () => ({ message: "Situação inválida" }) }),
  posicaoListaEspera: z
    .preprocess(
      (valor) => (valor === "" ? null : valor),
      z.coerce.number().int("Posição inválida").min(1, "Posição inválida").nullable()
    )
    .optional(),
  observacaoCoordenacao: z.string().trim().max(2000, "Use no máximo 2000 caracteres").nullish(),
});

const decisaoEmLoteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Selecione ao menos uma inscrição"),
  status: z.enum(STATUS, { errorMap: () => ({ message: "Situação inválida" }) }),
});

module.exports = {
  criarInscricaoMonitoriaSchema,
  configuracaoMonitoriaSchema,
  decisaoMonitoriaSchema,
  decisaoEmLoteSchema,
  idadeEm,
};
