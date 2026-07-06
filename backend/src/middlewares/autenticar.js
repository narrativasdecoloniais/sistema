const { verificarAccessToken, NOME_COOKIE_ACESSO } = require("../services/auth.service");

function autenticar(req, res, next) {
  const token = req.cookies?.[NOME_COOKIE_ACESSO];

  if (!token) {
    return res.status(401).json({ mensagem: "Sessão não encontrada. Faça login novamente." });
  }

  try {
    const payload = verificarAccessToken(token);
    req.usuario = { id: payload.sub, papeis: payload.papeis || [] };
    next();
  } catch (erro) {
    return res.status(401).json({ mensagem: "Sessão expirada. Faça login novamente." });
  }
}

module.exports = autenticar;
