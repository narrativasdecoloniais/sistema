const { verificarTokenSubmissao } = require("../services/submissoes.service");

const MENSAGEM_EXPIRADA = "Sessão de submissão expirada. Volte ao início e identifique-se novamente.";

function autenticarSubmissao(req, res, next) {
  const cabecalho = req.headers.authorization || "";
  const token = cabecalho.startsWith("Bearer ") ? cabecalho.slice(7) : null;

  if (!token) {
    return res.status(401).json({ mensagem: MENSAGEM_EXPIRADA });
  }

  const payload = verificarTokenSubmissao(token);
  if (!payload) {
    return res.status(401).json({ mensagem: MENSAGEM_EXPIRADA });
  }

  req.usuarioSubmissaoId = payload.sub;
  next();
}

module.exports = autenticarSubmissao;
