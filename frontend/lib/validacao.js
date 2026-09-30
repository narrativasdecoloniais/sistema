import { z } from "zod";
import { corSchema } from "@/lib/cores";
import { camposIdentificacao, validarIdentificacao } from "@/lib/identificacao";
import { idadeEm } from "@/lib/idade";

export const senhaForte = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(/[a-z]/, "A senha deve ter ao menos uma letra minúscula")
  .regex(/[A-Z]/, "A senha deve ter ao menos uma letra maiúscula")
  .regex(/[0-9]/, "A senha deve ter ao menos um número");

export const cadastroSchema = z
  .object({
    nome: z.string().trim().min(3, "Informe o nome completo"),
    email: z.string().trim().email("E-mail inválido"),
    ...camposIdentificacao,
    instituicao: z.string().trim().min(2, "Informe a instituição"),
    categoria: z.enum(["ESTUDANTE", "DOCENTE", "PESQUISADOR", "COMUNIDADE_EXTERNA"], {
      errorMap: () => ({ message: "Selecione uma categoria" }),
    }),
    senha: senhaForte,
    confirmarSenha: z.string(),
    aceiteTermos: z.literal(true, {
      errorMap: () => ({ message: "É necessário aceitar os termos de uso" }),
    }),
    aceitePrivacidade: z.literal(true, {
      errorMap: () => ({ message: "É necessário aceitar a política de privacidade" }),
    }),
  })
  .superRefine(validarIdentificacao)
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

export const loginSchema = z
  .object({
    ...camposIdentificacao,
    senha: z.string().min(1, "Informe a senha"),
  })
  .superRefine(validarIdentificacao);

export const recuperarSenhaSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
});

// Espelha recuperarSenhaCpfSchema em backend/src/validators/auth.validators.js.
export const recuperarSenhaCpfSchema = z.object({ ...camposIdentificacao }).superRefine(validarIdentificacao);

// Espelham backend/src/validators/regularizacaoContas.validators.js
// (regularização pública de cadastro — temporária, edição V).
export const buscaRegularizacaoSchema = z.object({
  nome: z.string().trim().min(5, "Digite seu nome completo").max(200),
});

export const planoRegularizacaoSchema = z
  .object({
    contaIds: z.array(z.string()).min(1, "Selecione a sua conta").max(2, "Selecione no máximo duas contas"),
    ...camposIdentificacao,
    manterId: z.string().optional(),
  })
  .superRefine(validarIdentificacao);

export const redefinirSenhaSchema = z
  .object({
    senha: senhaForte,
    confirmarSenha: z.string(),
  })
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

export const atualizarPerfilSchema = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo"),
  instituicao: z.string().trim().min(2, "Informe a instituição"),
  categoria: z.enum(["ESTUDANTE", "DOCENTE", "PESQUISADOR", "COMUNIDADE_EXTERNA"]),
  foto: z
    .string()
    .refine((valor) => valor.startsWith("data:image/"), "Foto inválida")
    .nullable()
    .optional(),
});

export const alterarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual"),
    novaSenha: senhaForte,
    confirmarNovaSenha: z.string(),
  })
  .refine((dados) => dados.novaSenha === dados.confirmarNovaSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarNovaSenha"],
  });

// Espelham solicitarTrocaEmailSchema/confirmarTrocaEmailSchema em
// backend/src/validators/usuarios.validators.js.
export const solicitarTrocaEmailSchema = z.object({
  novoEmail: z.string().trim().email("E-mail inválido"),
  senhaAtual: z.string().min(1, "Informe a senha atual"),
});

export const confirmarTrocaEmailSchema = z.object({
  novoEmail: z.string().trim().email("E-mail inválido"),
  codigo: z.string().trim().min(1, "Informe o código"),
});

// Extrai a primeira mensagem de erro de um resultado zod, indexada por campo.
// Pergunta de acessibilidade da inscrição geral — espelha adaptacaoSchema em
// backend/src/validators/inscricoes.validators.js (mudou um, muda o outro).
const MAX_ADAPTACOES = 2000;

export const adaptacaoInscricaoSchema = z
  .object({
    precisaAdaptacao: z.boolean({
      required_error: "Responda se você necessita de alguma adaptação ou recurso",
      invalid_type_error: "Responda se você necessita de alguma adaptação ou recurso",
    }),
    adaptacoesNecessarias: z
      .string()
      .trim()
      .max(MAX_ADAPTACOES, `Use no máximo ${MAX_ADAPTACOES} caracteres`)
      .nullish(),
  })
  .superRefine((dados, ctx) => {
    if (dados.precisaAdaptacao === true && !dados.adaptacoesNecessarias) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["adaptacoesNecessarias"],
        message: "Indique as adaptações ou recursos de que você necessita",
      });
    }
  })
  .transform(({ precisaAdaptacao, adaptacoesNecessarias }) => ({
    precisaAdaptacao,
    adaptacoesNecessarias: precisaAdaptacao ? adaptacoesNecessarias : null,
  }));

// Inscrição na monitoria — espelha criarInscricaoMonitoriaSchema e
// configuracaoMonitoriaSchema em backend/src/validators/monitoria.validators.js
// (mudou um, muda o outro). A idade conta no início do evento (dataReferencia).
const TIPOS_AUTORIZACAO_MONITORIA = ["application/pdf", "image/png", "image/jpeg"];
const TAMANHO_MAX_AUTORIZACAO_MONITORIA = 5 * 1024 * 1024;

function tamanhoDataUri(dataUri) {
  const base64 = dataUri.slice(dataUri.indexOf(",") + 1);
  return Math.floor((base64.length * 3) / 4);
}

const cienteMonitoria = (mensagem) => z.literal(true, { errorMap: () => ({ message: mensagem }) });

export function criarInscricaoMonitoriaSchema({ funcoesPermitidas, dataReferencia, temAutorizacaoSalva = false }) {
  return z
    .object({
      dataNascimento: z
        .string({ required_error: "Informe a data de nascimento" })
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data de nascimento")
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
      precisaAdaptacao: z.boolean({
        required_error: "Responda se você necessita de alguma adaptação ou recurso",
        invalid_type_error: "Responda se você necessita de alguma adaptação ou recurso",
      }),
      adaptacoesNecessarias: z.string().trim().max(MAX_ADAPTACOES, `Use no máximo ${MAX_ADAPTACOES} caracteres`).nullish(),
      cienteFormacao: cienteMonitoria("Confirme que está ciente da formação de monitores"),
      cienteDisponibilidade: cienteMonitoria("Confirme que está ciente da disponibilidade presencial"),
      cienteVoluntaria: cienteMonitoria("Confirme que está ciente de que a monitoria é voluntária"),
      autorizacaoResponsavel: z
        .string()
        .refine(
          (valor) => TIPOS_AUTORIZACAO_MONITORIA.some((tipo) => valor.startsWith(`data:${tipo};base64,`)),
          "Envie a autorização em PDF, JPG ou PNG"
        )
        .refine((valor) => tamanhoDataUri(valor) <= TAMANHO_MAX_AUTORIZACAO_MONITORIA, "O arquivo deve ter no máximo 5MB")
        .nullish(),
    })
    .superRefine((dados, ctx) => {
      if (dados.precisaAdaptacao === true && !dados.adaptacoesNecessarias) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["adaptacoesNecessarias"],
          message: "Indique as adaptações ou recursos de que você necessita",
        });
      }
      const menor = idadeEm(dados.dataNascimento, dataReferencia) < 18;
      if (menor && !dados.autorizacaoResponsavel && !temAutorizacaoSalva) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["autorizacaoResponsavel"],
          message: "Anexe a autorização do(a) responsável",
        });
      }
    });
}

export const configuracaoMonitoriaSchema = z
  .object({
    inicioInscricoesMonitoria: z.string().nullable(),
    fimInscricoesMonitoria: z.string().nullable(),
    vagasMonitoria: z
      .preprocess(
        (valor) => (valor === "" || valor === null ? null : Number(valor)),
        z
          .number({ invalid_type_error: "Informe um número de vagas válido" })
          .int("Informe um número inteiro")
          .min(1, "Informe ao menos 1 vaga")
          .max(10000, "Número de vagas muito alto")
          .nullable()
      ),
    funcoesMonitoria: z
      .array(z.string().trim().min(1, "Preencha o nome da atividade").max(200, "Use no máximo 200 caracteres"))
      .max(30, "Cadastre no máximo 30 atividades")
      .refine((lista) => new Set(lista).size === lista.length, "Há atividades repetidas na lista"),
    editalMonitoria: z.string().max(300000, "O edital está grande demais").nullable(),
  })
  .refine(
    (dados) =>
      !dados.inicioInscricoesMonitoria ||
      !dados.fimInscricoesMonitoria ||
      new Date(dados.fimInscricoesMonitoria) > new Date(dados.inicioInscricoesMonitoria),
    { message: "O fim das inscrições deve ser depois do início", path: ["fimInscricoesMonitoria"] }
  );

export function extrairErros(resultado) {
  const erros = {};
  if (resultado.success) return erros;

  for (const problema of resultado.error.issues) {
    const campo = problema.path.join(".");
    if (campo && !erros[campo]) {
      erros[campo] = problema.message;
    }
  }
  return erros;
}

export const edicaoRealizadorSchema = z
  .object({
    id: z.string().optional(),
    nome: z.string().trim().min(2, "Informe o nome do realizador"),
    imagem: z
      .string()
      .refine((valor) => valor.startsWith("data:image/"), "Imagem inválida")
      .optional(),
    link: z.string().trim().url("Link inválido").optional(),
  })
  .refine((dados) => dados.id || dados.imagem, {
    message: "Selecione uma imagem",
    path: ["imagem"],
  });

export const edicaoApoiadorSchema = z
  .object({
    id: z.string().optional(),
    nome: z.string().trim().min(2, "Informe o nome do apoiador"),
    imagem: z
      .string()
      .refine((valor) => valor.startsWith("data:image/"), "Imagem inválida")
      .optional(),
    link: z.string().trim().url("Link inválido").optional(),
  })
  .refine((dados) => dados.id || dados.imagem, {
    message: "Selecione uma imagem",
    path: ["imagem"],
  });

export const edicaoPontoInteresseSchema = z.object({
  id: z.string().optional(),
  tipoId: z.string().min(1, "Selecione o tipo"),
  nome: z.string().trim().min(2, "Informe o nome do ponto"),
  imagem: z
    .string()
    .refine((valor) => valor.startsWith("data:image/"), "Imagem inválida")
    .nullable()
    .optional(),
  endereco: z.string().trim().optional(),
  latitude: z
    .number({ invalid_type_error: "Informe a latitude" })
    .min(-90, "Latitude inválida")
    .max(90, "Latitude inválida"),
  longitude: z
    .number({ invalid_type_error: "Informe a longitude" })
    .min(-180, "Longitude inválida")
    .max(180, "Longitude inválida"),
  link: z.string().trim().url("Link inválido").optional(),
});

export const edicaoSchema = z
  .object({
    numero: z.coerce
      .number({ invalid_type_error: "Informe um número de edição válido" })
      .int("Informe um número de edição válido")
      .positive("Informe um número de edição válido"),
    nome: z.string().trim().min(3, "Informe o nome da edição"),
    descricao: z
      .string()
      .trim()
      .max(2000, "A descrição deve ter no máximo 2000 caracteres")
      .optional(),
    dataInicio: z
      .coerce.date({
        errorMap: () => ({ message: "Informe uma data de início válida" }),
      })
      .optional(),
    dataFim: z
      .coerce.date({
        errorMap: () => ({ message: "Informe uma data de término válida" }),
      })
      .optional(),
    inicioInscricoes: z
      .coerce.date({
        errorMap: () => ({ message: "Informe uma data de início de inscrições válida" }),
      })
      .optional(),
    fimInscricoes: z
      .coerce.date({
        errorMap: () => ({ message: "Informe uma data de término de inscrições válida" }),
      })
      .optional(),
    inscricoesEncerradasManualmente: z.boolean().optional(),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen")
      .optional(),
    cargaHorariaTotal: z.coerce
      .number({ invalid_type_error: "Informe uma carga horária válida" })
      .int("Informe uma carga horária válida")
      .positive("Informe uma carga horária válida")
      .optional(),
    instagram: z.string().trim().optional(),
    facebook: z.string().trim().optional(),
    emailContato: z.string().trim().email("E-mail inválido").optional().or(z.literal("")),
    linksExtras: z
      .array(
        z.object({
          rotulo: z.string().trim().min(1, "Informe um rótulo"),
          url: z.string().trim().url("URL inválida"),
        })
      )
      .optional(),
    modalidade: z.enum(["ONLINE", "PRESENCIAL", "HIBRIDO"], {
      errorMap: () => ({ message: "Modalidade inválida" }),
    }).optional(),
    local: z.string().trim().optional(),
    pais: z.string().trim().optional(),
    estado: z.string().trim().optional(),
    cidade: z.string().trim().optional(),
    fusoHorario: z.string().optional(),
    notificarAlteracoes: z.boolean().optional(),
    corFundoRealizadores: corSchema,
    realizadores: z.array(edicaoRealizadorSchema).optional(),
  })
  .refine((dados) => !dados.dataInicio || !dados.dataFim || dados.dataFim > dados.dataInicio, {
    message: "A data de término deve ser posterior à data de início",
    path: ["dataFim"],
  })
  .refine(
    (dados) =>
      !dados.inicioInscricoes || !dados.fimInscricoes || dados.fimInscricoes > dados.inicioInscricoes,
    {
      message: "O fim das inscrições deve ser posterior ao início",
      path: ["fimInscricoes"],
    }
  );

export const permissoesSecoesSchema = z.object({
  acessoCompleto: z.boolean().default(false),
  secoesPermitidas: z.array(z.string()).default([]),
});

export const participanteSchema = z
  .object({
    nome: z.string().trim().min(3, "Informe o nome completo"),
    email: z.string().trim().email("E-mail inválido"),
  })
  .merge(permissoesSecoesSchema);

export const alterarEmailUsuarioSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
});

export const definirSenhaSchema = z
  .object({
    ...camposIdentificacao,
    senha: senhaForte,
    confirmarSenha: z.string(),
    aceiteTermos: z.literal(true, {
      errorMap: () => ({ message: "É necessário aceitar os termos de uso" }),
    }),
    aceitePrivacidade: z.literal(true, {
      errorMap: () => ({ message: "É necessário aceitar a política de privacidade" }),
    }),
  })
  .superRefine(validarIdentificacao)
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

export const tipoAtividadeSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do tipo de atividade"),
});

export const tipoPontoInteresseSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do tipo de ponto de referência"),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
});

export const itemConteudoSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(1, "Informe o nome do item"),
  imagem: z
    .string()
    .refine((valor) => valor.startsWith("data:image/"), "Imagem inválida")
    .nullable()
    .optional(),
  link: z.string().trim().url("Link inválido").optional().or(z.literal("")),
});

export const listaConteudoSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(1, "Informe o nome da lista"),
  itens: z.array(itemConteudoSchema).optional(),
});

export const grupoConteudoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do grupo"),
  listas: z.array(listaConteudoSchema).optional(),
});

export const tipoParticipacaoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do tipo de participação"),
  ordem: z
    .number({ invalid_type_error: "Informe um número inteiro" })
    .int("Informe um número inteiro")
    .min(1, "A ordem deve ser 1 ou maior")
    .nullable()
    .optional(),
});

export const atividadePessoaSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(2, "Informe o nome da pessoa"),
  imagem: z
    .string()
    .refine((valor) => valor.startsWith("data:image/"), "Imagem inválida")
    .nullable()
    .optional(),
  descricao: z
    .string()
    .trim()
    .max(2000, "A descrição deve ter no máximo 2000 caracteres")
    .optional(),
  breveDescricao: z
    .string()
    .trim()
    .max(200, "A breve descrição deve ter no máximo 200 caracteres")
    .optional(),
  tipoParticipacaoId: z.string().nullable().optional(),
});

export const atividadeSchema = z
  .object({
    tipoAtividadeId: z.string().min(1, "Selecione um tipo de atividade"),
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
    atividadeContinua: z.boolean().optional().default(false),
    paraConvidados: z.boolean().optional().default(false),
    paraCriancasConvidadas: z.boolean().optional().default(false),
    ordem: z
      .number({ invalid_type_error: "Informe um número inteiro" })
      .int("Informe um número inteiro")
      .min(1, "A ordem deve ser 1 ou maior")
      .nullable()
      .optional(),
  })
  .refine((dados) => dados.fimAtividade > dados.inicioAtividade, {
    message: "O fim da atividade deve ser posterior ao início",
    path: ["fimAtividade"],
  })
  .refine((dados) => !dados.exigeInscricao || dados.semLimiteVagas || dados.vagas != null, {
    message: "Informe a quantidade de vagas ou marque sem limite",
    path: ["vagas"],
  });

export const areaSubmissaoSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  titulo: z.string().trim().min(3, "Informe o título da área"),
  descricao: z.string().trim().optional(),
  atividadeIds: z.array(z.string()).optional().default([]),
});

export const modalidadeSubmissaoSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
    nome: z.string().trim().min(3, "Informe o nome da modalidade"),
    subtitulo: z.string().trim().optional(),
    prazoInicio: z.coerce.date({
      errorMap: () => ({ message: "Informe uma data de início válida" }),
    }),
    prazoFim: z.coerce.date({
      errorMap: () => ({ message: "Informe uma data de término válida" }),
    }),
    resumoCurto: z.string().trim().min(1, "Informe o resumo curto"),
    perguntaTitulo: z.string().trim().min(1, "Informe o título da seção de descrição"),
    descricao: z.string().trim().optional(),
    linkRotulo: z.string().trim().optional(),
    rotuloItem: z.string().trim().optional(),
    areas: z.array(areaSubmissaoSchema).optional(),
  })
  .refine((dados) => dados.prazoFim > dados.prazoInicio, {
    message: "O prazo final deve ser posterior ao início",
    path: ["prazoFim"],
  })
  .refine(
    (dados) => !dados.areas || new Set(dados.areas.map((area) => area.slug)).size === dados.areas.length,
    { message: "As áreas não podem repetir o mesmo slug", path: ["areas"] }
  );

export const inscricaoEdicaoAdminSchema = z.object({
  usuarioId: z.string().min(1, "Selecione um usuário"),
});

export const inscricaoAtividadeAdminSchema = z.object({
  usuarioId: z.string().min(1, "Selecione um usuário"),
  atividadeId: z.string().min(1, "Selecione uma atividade"),
  status: z.enum(["CONFIRMADA", "LISTA_ESPERA"], {
    errorMap: () => ({ message: "Selecione um status" }),
  }),
});

// Espelha backend/src/validators/avaliacoes.validators.js.
const DECISOES_AVALIACAO = ["APROVADO", "APROVADO_COM_RESSALVAS", "APROVADO_FORMATACAO", "REPROVADO"];

// Conta existente (usuarioId, via busca) OU convite por e-mail (nome+email).
export const avaliadorSchema = z
  .object({
    usuarioId: z.string().optional(),
    nome: z.string().trim().optional(),
    email: z.string().trim().optional(),
    areaIds: z.array(z.string()).default([]),
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

export const atribuirAvaliadorSchema = z.object({
  avaliadorEdicaoId: z.string().min(1, "Selecione um avaliador"),
  submissaoIds: z.array(z.string()).min(1, "Selecione ao menos uma submissão"),
});

export const decisaoAvaliadorSchema = z.object({
  decisao: z.enum(DECISOES_AVALIACAO, { errorMap: () => ({ message: "Selecione uma decisão" }) }),
});

export const sugestaoAreaSchema = z.object({
  areaSugeridaId: z.string().min(1, "Selecione a área sugerida"),
  justificativa: z.string().trim().max(2000, "Máximo de 2000 caracteres").optional().default(""),
});

// Espelha conteudoSubmissaoSchema em backend/src/validators/submissoesAdmin.validators.js
// (editor da organização — referência pode ficar vazia).
export const conteudoSubmissaoSchema = z.object({
  titulo: z.string().trim().min(3, "Informe o título do trabalho").max(500, "Máximo de 500 caracteres"),
  resumo: z.string().trim().min(1, "Informe o resumo"),
  referenciaBibliografica: z.string().trim().default(""),
  versaoBase: z.string().datetime({ message: "Versão inválida — recarregue a página" }),
});

// Espelha areaSubmissaoAdminSchema em backend/src/validators/submissoesAdmin.validators.js.
export const areaSubmissaoAdminSchema = z.object({
  areaSubmissaoId: z.string().min(1, "Selecione a área"),
});

// Espelha correcaoSubmissaoSchema em backend/src/validators/submissoes.validators.js.
export const correcaoSubmissaoSchema = z.object({
  titulo: z.string().trim().min(3, "Informe o título do trabalho").max(500).optional(),
  resumo: z.string().trim().min(1, "Informe o resumo"),
  referenciaBibliografica: z.string().trim().min(1, "Informe a referência bibliográfica"),
});

// Espelha backend/src/validators/resultadoSubmissoes.validators.js.
export const modeloEmailResultadoSchema = z.object({
  assunto: z.string().trim().min(3, "Informe o assunto").max(200, "Máximo de 200 caracteres"),
  corpo: z.string().trim().min(1, "Informe o texto do e-mail"),
});

// Espelha modeloCertificadoSchema em backend/src/validators/certificados.validators.js
// (imagemFundo fica de fora: o próprio campo de upload valida o arquivo).
const numeroCertificado = (min, max, rotulo) =>
  z
    .number({ invalid_type_error: `Informe ${rotulo}`, required_error: `Informe ${rotulo}` })
    .min(min, `${rotulo[0].toUpperCase()}${rotulo.slice(1)} deve ser no mínimo ${min}`)
    .max(max, `${rotulo[0].toUpperCase()}${rotulo.slice(1)} deve ser no máximo ${max}`);

export const modeloCertificadoSchema = z
  .object({
    texto: z.string().trim().min(1, "Escreva o texto do certificado"),
    margemSuperior: numeroCertificado(0, 180, "a margem superior"),
    margemInferior: numeroCertificado(0, 180, "a margem inferior"),
    margemEsquerda: numeroCertificado(0, 260, "a margem esquerda"),
    margemDireita: numeroCertificado(0, 260, "a margem direita"),
    alinhamento: z.enum(["ESQUERDA", "CENTRO", "DIREITA", "JUSTIFICADO"]),
    alinhamentoVertical: z.enum(["TOPO", "CENTRO"]),
    fonte: z.enum(["ARCHIVO", "TIMES", "HELVETICA"]),
    tamanhoFonte: numeroCertificado(6, 72, "o tamanho da fonte"),
    entrelinha: numeroCertificado(1, 3, "o espaçamento entre linhas"),
    corTexto: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Escolha uma cor válida"),
    posicaoQr: z.enum(["INFERIOR_DIREITO", "INFERIOR_ESQUERDO", "SUPERIOR_DIREITO", "SUPERIOR_ESQUERDO"]),
    tamanhoQr: numeroCertificado(15, 60, "o tamanho do QR code"),
    margemQr: numeroCertificado(0, 60, "a distância do QR code até a borda"),
    cargaHoraria: z
      .number({ invalid_type_error: "Carga horária inválida" })
      .int("A carga horária deve ser um número inteiro")
      .min(1, "A carga horária deve ser de pelo menos 1 hora")
      .max(2000, "Carga horária grande demais")
      .nullable()
      .optional(),
  })
  .refine((d) => d.margemSuperior + d.margemInferior <= 190, {
    message: "As margens superior e inferior somadas deixam pouco espaço para o texto",
    path: ["margemInferior"],
  })
  .refine((d) => d.margemEsquerda + d.margemDireita <= 277, {
    message: "As margens esquerda e direita somadas deixam pouco espaço para o texto",
    path: ["margemDireita"],
  });

export const conferirCorrecaoSchema = z
  .object({
    aceitar: z.boolean(),
    motivo: z.string().trim().max(5000, "Máximo de 5000 caracteres").optional().default(""),
  })
  .refine((dados) => dados.aceitar || dados.motivo.length >= 3, {
    message: "Explique o que ainda precisa ser corrigido",
    path: ["motivo"],
  });

export const submissaoEmailSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
});

export const submissaoCadastroSchema = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo"),
  email: z.string().trim().email("E-mail inválido"),
  instituicao: z.string().trim().min(2, "Informe a instituição"),
  categoria: z.enum(["ESTUDANTE", "DOCENTE", "PESQUISADOR", "COMUNIDADE_EXTERNA"], {
    errorMap: () => ({ message: "Selecione uma categoria" }),
  }),
  aceiteTermos: z.literal(true, {
    errorMap: () => ({ message: "É necessário aceitar os termos de uso" }),
  }),
  aceitePrivacidade: z.literal(true, {
    errorMap: () => ({ message: "É necessário aceitar a política de privacidade" }),
  }),
});

export const submissaoAutorSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do autor"),
  email: z.string().trim().email("E-mail inválido"),
  orcid: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/, "ORCID inválido")
    .optional()
    .or(z.literal("")),
});

export const submissaoSchema = z.object({
  modalidadeSubmissaoId: z.string().min(1, "Selecione a modalidade"),
  areaSubmissaoId: z.string().optional(),
  titulo: z.string().trim().min(3, "Informe o título do trabalho").max(500),
  resumo: z.string().trim().min(1, "Informe o resumo"),
  referenciaBibliografica: z.string().trim().min(1, "Informe a referência bibliográfica"),
  aceiteDeclaracao: z.literal(true, {
    errorMap: () => ({ message: "É necessário declarar concordância com as regras de submissão" }),
  }),
});

// Espelho de criarSubmissaoAdminSchema (backend/src/validators/submissoesAdmin.validators.js).
export const submissaoAdminSchema = submissaoSchema
  .omit({ aceiteDeclaracao: true })
  .extend({
    usuarioId: z.string().optional(),
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

// ---------------------------------------------------------------------------
// Anais — espelho de backend/src/validators/anais.validators.js e de
// backend/src/utils/validarIssnIsbn.js (mudou lá, muda aqui).
// ---------------------------------------------------------------------------

export function normalizarIssn(valor) {
  const limpo = String(valor || "").toUpperCase().replace(/[^0-9X]/g, "");
  if (!/^\d{7}[\dX]$/.test(limpo)) return null;
  const soma = [...limpo.slice(0, 7)].reduce((total, digito, i) => total + Number(digito) * (8 - i), 0);
  const resto = (11 - (soma % 11)) % 11;
  if ((resto === 10 ? "X" : String(resto)) !== limpo[7]) return null;
  return `${limpo.slice(0, 4)}-${limpo.slice(4)}`;
}

export function isbnValido(valor) {
  const digitos = String(valor || "").toUpperCase().replace(/^ISBN[:\s]*/, "").replace(/[^0-9X]/g, "");
  if (/^\d{13}$/.test(digitos)) {
    return [...digitos].reduce((total, d, i) => total + Number(d) * (i % 2 === 0 ? 1 : 3), 0) % 10 === 0;
  }
  if (/^\d{9}[\dX]$/.test(digitos)) {
    return [...digitos].reduce((total, d, i) => total + (d === "X" ? 10 : Number(d)) * (10 - i), 0) % 11 === 0;
  }
  return false;
}

const textoOpcionalAnais = (maximo) => z.string().trim().max(maximo, `Use no máximo ${maximo} caracteres`).optional().or(z.literal(""));

export const anaisConfiguracaoSchema = z.object({
  titulo: z.string().trim().min(3, "Informe o título dos Anais").max(300, "Use no máximo 300 caracteres"),
  subtitulo: textoOpcionalAnais(300),
  nomeEvento: textoOpcionalAnais(300),
  issn: z
    .string()
    .trim()
    .optional()
    .refine((valor) => !valor || normalizarIssn(valor), "ISSN inválido — confira os 8 dígitos (ex. 1234-5679)"),
  isbn: z
    .string()
    .trim()
    .optional()
    .refine((valor) => !valor || isbnValido(valor), "ISBN inválido — confira os 10 ou 13 dígitos"),
  editora: textoOpcionalAnais(200),
  localPublicacao: textoOpcionalAnais(120),
  anoPublicacao: z
    .union([z.literal(""), z.null(), z.coerce.number().int("Informe um ano válido").min(1900, "Informe um ano válido").max(2200, "Informe um ano válido")])
    .optional(),
  organizadores: z.array(z.string().trim().min(1, "Preencha o nome").max(200, "Use no máximo 200 caracteres")).max(30, "Cadastre no máximo 30 pessoas"),
  licenca: z.string().min(1, "Escolha a licença"),
  apresentacao: z.string().optional().nullable(),
  fichaCatalografica: textoOpcionalAnais(4000),
  gruposConteudoIds: z.array(z.string()),
});

export const comentarioAnaisSchema = z.object({
  texto: z
    .string()
    .trim()
    .min(2, "Escreva o comentário")
    .max(2000, "O comentário pode ter no máximo 2000 caracteres"),
});

export const categorias = [
  { valor: "ESTUDANTE", rotulo: "Estudante" },
  { valor: "DOCENTE", rotulo: "Docente" },
  { valor: "PESQUISADOR", rotulo: "Pesquisador(a)" },
  { valor: "COMUNIDADE_EXTERNA", rotulo: "Comunidade externa" },
];
