function autorizarSecao(...secoes) {
  return (req, res, next) => {
    const { papeis = [], acessoCompleto, secoesPermitidas = [] } = req.usuario || {};

    if (papeis.includes("ADMIN")) return next();

    if (papeis.includes("ORGANIZADOR")) {
      const liberado = acessoCompleto || secoes.some((secao) => secoesPermitidas.includes(secao));
      if (liberado) return next();
    }

    return res.status(403).json({ mensagem: "Você não tem permissão para acessar este recurso." });
  };
}

module.exports = autorizarSecao;
