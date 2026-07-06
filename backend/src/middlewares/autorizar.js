function autorizar(...papeisPermitidos) {
  return (req, res, next) => {
    const papeisDoUsuario = req.usuario?.papeis || [];
    const temPermissao = papeisPermitidos.some((papel) => papeisDoUsuario.includes(papel));

    if (!temPermissao) {
      return res.status(403).json({ mensagem: "Você não tem permissão para acessar este recurso." });
    }

    next();
  };
}

module.exports = autorizar;
