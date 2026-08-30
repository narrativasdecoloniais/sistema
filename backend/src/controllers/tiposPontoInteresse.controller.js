const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const { tipoPontoInteresseSchema } = require("../validators/tiposPontoInteresse.validators");
const tiposPontoInteresseService = require("../services/tiposPontoInteresse.service");

const listar = asyncHandler(async (req, res) => {
  const tiposPontoInteresse = await tiposPontoInteresseService.listarTiposPontoInteresse();
  return res.json({ tiposPontoInteresse });
});

const buscarPorId = asyncHandler(async (req, res) => {
  const tipoPontoInteresse = await tiposPontoInteresseService.buscarPorId(req.params.id);
  if (!tipoPontoInteresse) throw new ErroHttp(404, "Tipo de ponto de referência não encontrado.");
  return res.json({ tipoPontoInteresse });
});

const criar = asyncHandler(async (req, res) => {
  const dados = tipoPontoInteresseSchema.parse(req.body);
  const tipoPontoInteresse = await tiposPontoInteresseService.criarTipoPontoInteresse(dados);
  return res.status(201).json({ tipoPontoInteresse });
});

const atualizar = asyncHandler(async (req, res) => {
  const existente = await tiposPontoInteresseService.buscarPorId(req.params.id);
  if (!existente) throw new ErroHttp(404, "Tipo de ponto de referência não encontrado.");
  const dados = tipoPontoInteresseSchema.parse(req.body);
  const tipoPontoInteresse = await tiposPontoInteresseService.atualizarTipoPontoInteresse(req.params.id, dados);
  return res.json({ tipoPontoInteresse });
});

const excluir = asyncHandler(async (req, res) => {
  const existente = await tiposPontoInteresseService.buscarPorId(req.params.id);
  if (!existente) throw new ErroHttp(404, "Tipo de ponto de referência não encontrado.");
  await tiposPontoInteresseService.excluirTipoPontoInteresse(req.params.id);
  return res.json({ mensagem: "Tipo de ponto de referência excluído com sucesso." });
});

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
