const { z } = require("zod");
const { camposIdentificacao, validarIdentificacao } = require("./identificacao.validators");

const senhaForte = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(/[a-z]/, "A senha deve ter ao menos uma letra minúscula")
  .regex(/[A-Z]/, "A senha deve ter ao menos uma letra maiúscula")
  .regex(/[0-9]/, "A senha deve ter ao menos um número");

const cadastroSchema = z
  .object({
    nome: z.string().trim().min(3, "Informe o nome completo"),
    email: z.string().trim().email("E-mail inválido"),
    ...camposIdentificacao,
    instituicao: z.string().trim().min(2, "Informe a instituição"),
    categoria: z.enum(["ESTUDANTE", "DOCENTE", "PESQUISADOR", "COMUNIDADE_EXTERNA"], {
      errorMap: () => ({ message: "Categoria inválida" }),
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

const loginSchema = z
  .object({
    ...camposIdentificacao,
    senha: z.string().min(1, "Informe a senha"),
  })
  .superRefine(validarIdentificacao);

const recuperarSenhaSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
});

const recuperarSenhaCpfSchema = z.object({ ...camposIdentificacao }).superRefine(validarIdentificacao);

const redefinirSenhaSchema = z.object({
  token: z.string().min(1, "Token ausente"),
  senha: senhaForte,
  confirmarSenha: z.string(),
}).refine((dados) => dados.senha === dados.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

const definirSenhaSchema = z
  .object({
    token: z.string().min(1, "Token ausente"),
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

module.exports = {
  senhaForte,
  cadastroSchema,
  loginSchema,
  recuperarSenhaSchema,
  recuperarSenhaCpfSchema,
  redefinirSenhaSchema,
  definirSenhaSchema,
};
