const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const { tipoComissaoSchema } = require("../validators/tiposComissao.validators");
const tiposComissaoService = require("../services/tiposComissao.service");

const listar = asyncHandler(async (req, res) => {
  const tiposComissao = await tiposComissaoService.listarTiposComissao();
  return res.json({ tiposComissao });
});

const buscarPorId = asyncHandler(async (req, res) => {
  const tipoComissao = await tiposComissaoService.buscarPorId(req.params.id);
  if (!tipoComissao) throw new ErroHttp(404, "Tipo de comissão não encontrado.");
  return res.json({ tipoComissao });
});

const criar = asyncHandler(async (req, res) => {
  const dados = tipoComissaoSchema.parse(req.body);
  const tipoComissao = await tiposComissaoService.criarTipoComissao(dados);
  return res.status(201).json({ tipoComissao });
});

const atualizar = asyncHandler(async (req, res) => {
  const existente = await tiposComissaoService.buscarPorId(req.params.id);
  if (!existente) throw new ErroHttp(404, "Tipo de comissão não encontrado.");
  const dados = tipoComissaoSchema.parse(req.body);
  const tipoComissao = await tiposComissaoService.atualizarTipoComissao(req.params.id, dados);
  return res.json({ tipoComissao });
});

const excluir = asyncHandler(async (req, res) => {
  const existente = await tiposComissaoService.buscarPorId(req.params.id);
  if (!existente) throw new ErroHttp(404, "Tipo de comissão não encontrado.");
  await tiposComissaoService.excluirTipoComissao(req.params.id);
  return res.json({ mensagem: "Tipo de comissão excluído com sucesso." });
});

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
