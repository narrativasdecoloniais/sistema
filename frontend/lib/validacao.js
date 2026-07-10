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
    const campo = problema.path[0];
    if (campo && !erros[campo]) {
      erros[campo] = problema.message;
    }
  }
  return erros;
}

export const categorias = [
  { valor: "ESTUDANTE", rotulo: "Estudante" },
  { valor: "DOCENTE", rotulo: "Docente" },
  { valor: "PESQUISADOR", rotulo: "Pesquisador(a)" },
  { valor: "COMUNIDADE_EXTERNA", rotulo: "Comunidade externa" },
];
