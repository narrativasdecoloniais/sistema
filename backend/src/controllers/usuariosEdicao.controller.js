const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const edicoesService = require("../services/edicoes.service");
const usuariosEdicaoService = require("../services/usuariosEdicao.service");

const listar = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarPorId(req.params.edicaoId);
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");

  const usuarios = await usuariosEdicaoService.listarComSituacaoNaEdicao(req.params.edicaoId);
  return res.json({ usuarios });
});

module.exports = { listar };
