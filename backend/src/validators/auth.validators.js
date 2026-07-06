const { z } = require("zod");
const { cpfValido, apenasDigitos } = require("../utils/cpf");

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
    cpf: z
      .string()
      .transform(apenasDigitos)
      .refine(cpfValido, "CPF inválido"),
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
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

const loginSchema = z.object({
  cpf: z.string().transform(apenasDigitos),
  senha: z.string().min(1, "Informe a senha"),
});

const recuperarSenhaSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
});

const redefinirSenhaSchema = z.object({
  token: z.string().min(1, "Token ausente"),
  senha: senhaForte,
  confirmarSenha: z.string(),
}).refine((dados) => dados.senha === dados.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

module.exports = {
  senhaForte,
  cadastroSchema,
  loginSchema,
  recuperarSenhaSchema,
  redefinirSenhaSchema,
};
