const { z } = require("zod");
const { cpfValido } = require("../utils/cpf");
const { normalizarDocumento } = require("../utils/identificacao");

// Identificação de quem entra ou se cadastra: CPF (padrão) ou, para
// estrangeiros, número do documento do próprio país + país. Espalhe
// camposIdentificacao no z.object e passe validarIdentificacao num
// superRefine; depois use identificacaoDe (utils/identificacao.js).
const camposIdentificacao = {
  tipoDocumento: z.enum(["CPF", "ESTRANGEIRO"]).default("CPF"),
  cpf: z.string().optional(),
  documento: z.string().max(60, "Máximo de 60 caracteres").optional(),
  pais: z.string().optional(),
};

function validarIdentificacao(dados, ctx) {
  if (dados.tipoDocumento === "ESTRANGEIRO") {
    if (normalizarDocumento(dados.documento).length < 3) {
      ctx.addIssue({ code: "custom", path: ["documento"], message: "Informe o número do documento" });
    }
    if (!/^[A-Z]{2}$/.test(dados.pais || "")) {
      ctx.addIssue({ code: "custom", path: ["pais"], message: "Selecione o país" });
    }
    return;
  }
  if (!cpfValido(dados.cpf || "")) {
    ctx.addIssue({ code: "custom", path: ["cpf"], message: "CPF inválido" });
  }
}

module.exports = { camposIdentificacao, validarIdentificacao };
