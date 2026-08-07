const { verificarTokenInscricao } = require("../services/inscricoes.service");

const MENSAGEM_EXPIRADA = "Sessão de inscrição expirada. Volte ao início e informe seu CPF novamente.";

function autenticarInscricao(req, res, next) {
  const cabecalho = req.headers.authorization || "";
  const token = cabecalho.startsWith("Bearer ") ? cabecalho.slice(7) : null;

  if (!token) {
    return res.status(401).json({ mensagem: MENSAGEM_EXPIRADA });
  }

  const payload = verificarTokenInscricao(token);
  if (!payload) {
    return res.status(401).json({ mensagem: MENSAGEM_EXPIRADA });
  }

  req.usuarioInscricaoId = payload.sub;
  next();
}

module.exports = autenticarInscricao;
