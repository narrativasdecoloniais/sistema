import { z } from "zod";
import { apenasDigitos, cpfValido } from "@/lib/cpf";

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
    cpf: z.string().refine((valor) => cpfValido(valor), "CPF inválido"),
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
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

export const inscricaoCpfSchema = z.object({
  cpf: z
    .string()
    .min(1, "Informe o CPF")
    .refine((valor) => cpfValido(valor), "CPF inválido"),
});

export const inscricaoIdentidadeSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
});

export const inscricaoCadastroSchema = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo"),
  email: z.string().trim().email("E-mail inválido"),
  cpf: z.string().refine((valor) => cpfValido(valor), "CPF inválido"),
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

export const loginSchema = z.object({
  cpf: z
    .string()
    .min(1, "Informe o CPF")
    .refine((valor) => apenasDigitos(valor).length === 11, "CPF inválido"),
  senha: z.string().min(1, "Informe a senha"),
});

export const recuperarSenhaSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
});

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

// Extrai a primeira mensagem de erro de um resultado zod, indexada por campo.
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
    corFundoRealizadores: z.enum(["PAPEL", "TINTA", "BARRO", "OCRE", "BUZIO", "AREIA", "CERRADO"]).optional(),
    realizadores: z.array(edicaoRealizadorSchema).optional(),
  })
  .refine((dados) => !dados.dataInicio || !dados.dataFim || dados.dataFim > dados.dataInicio, {
    message: "A data de término deve ser posterior à data de início",
    path: ["dataFim"],
  });

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

export const definirSenhaSchema = z
  .object({
    cpf: z.string().refine((valor) => cpfValido(valor), "CPF inválido"),
    senha: senhaForte,
    confirmarSenha: z.string(),
    aceiteTermos: z.literal(true, {
      errorMap: () => ({ message: "É necessário aceitar os termos de uso" }),
    }),
    aceitePrivacidade: z.literal(true, {
      errorMap: () => ({ message: "É necessário aceitar a política de privacidade" }),
    }),
  })
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

export const tipoAtividadeSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do tipo de atividade"),
});

export const tipoParticipacaoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do tipo de participação"),
});

export const programaPosGraduacaoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do programa"),
  link: z.string().trim().url("Link inválido").optional(),
  imagem: z
    .string()
    .refine((valor) => valor.startsWith("data:image/"), "Imagem inválida")
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
  })
  .refine((dados) => dados.fimAtividade > dados.inicioAtividade, {
    message: "O fim da atividade deve ser posterior ao início",
    path: ["fimAtividade"],
  })
  .refine((dados) => !dados.exigeInscricao || dados.semLimiteVagas || dados.vagas != null, {
    message: "Informe a quantidade de vagas ou marque sem limite",
    path: ["vagas"],
  });

export const pessoaAreaSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(2, "Informe o nome da pessoa"),
  afiliacao: z.string().trim().max(200, "A afiliação deve ter no máximo 200 caracteres").optional(),
  papel: z.enum(["COORDENACAO", "CONVIDADO"], {
    errorMap: () => ({ message: "Selecione o papel da pessoa" }),
  }),
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
  pessoas: z.array(pessoaAreaSchema).optional(),
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

export const categorias = [
  { valor: "ESTUDANTE", rotulo: "Estudante" },
  { valor: "DOCENTE", rotulo: "Docente" },
  { valor: "PESQUISADOR", rotulo: "Pesquisador(a)" },
  { valor: "COMUNIDADE_EXTERNA", rotulo: "Comunidade externa" },
];
