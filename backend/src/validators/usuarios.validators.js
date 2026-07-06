const { z } = require("zod");
const { senhaForte } = require("./auth.validators");

const atualizarPerfilSchema = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo").optional(),
  instituicao: z.string().trim().min(2, "Informe a instituição").optional(),
  categoria: z
    .enum(["ESTUDANTE", "DOCENTE", "PESQUISADOR", "COMUNIDADE_EXTERNA"], {
      errorMap: () => ({ message: "Categoria inválida" }),
    })
    .optional(),
});

const alterarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual"),
    novaSenha: senhaForte,
    confirmarNovaSenha: z.string(),
  })
  .refine((dados) => dados.novaSenha === dados.confirmarNovaSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarNovaSenha"],
  });

module.exports = { atualizarPerfilSchema, alterarSenhaSchema };
