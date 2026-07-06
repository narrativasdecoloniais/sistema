const { ZodError } = require("zod");
const ErroHttp = require("../utils/erroHttp");

// eslint-disable-next-line no-unused-vars
function errorHandler(erro, req, res, next) {
  if (erro instanceof ZodError) {
    const primeiro = erro.errors[0];
    return res.status(400).json({ mensagem: primeiro?.message || "Dados inválidos", campo: primeiro?.path?.[0] });
  }

  if (erro instanceof ErroHttp) {
    return res.status(erro.status).json({ mensagem: erro.message });
  }

  if (erro?.code === "P2002") {
    return res.status(409).json({ mensagem: "Já existe um cadastro com esses dados." });
  }

  console.error(erro);
  return res.status(500).json({ mensagem: "Erro interno. Tente novamente mais tarde." });
}

module.exports = errorHandler;
