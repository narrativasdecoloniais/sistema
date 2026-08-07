const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const { edicaoSchema } = require("../validators/edicoes.validators");
const edicoesService = require("../services/edicoes.service");

const listar = asyncHandler(async (req, res) => {
  const edicoes = await edicoesService.listarEdicoes();
  return res.json({ edicoes });
});

const buscarPorId = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarPorId(req.params.id);
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
  return res.json({ edicao });
});

const criar = asyncHandler(async (req, res) => {
  const dados = edicaoSchema.parse(req.body);
  const edicao = await edicoesService.criarEdicao(dados);
  return res.status(201).json({ edicao });
});

const atualizar = asyncHandler(async (req, res) => {
  const existente = await edicoesService.buscarPorId(req.params.id);
  if (!existente) throw new ErroHttp(404, "Edição não encontrada.");
  const dados = edicaoSchema.parse(req.body);
  const edicao = await edicoesService.atualizarEdicao(req.params.id, dados);
  return res.json({ edicao });
});

const excluir = asyncHandler(async (req, res) => {
  const existente = await edicoesService.buscarPorId(req.params.id);
  if (!existente) throw new ErroHttp(404, "Edição não encontrada.");
  await edicoesService.excluirEdicao(req.params.id);
  return res.json({ mensagem: "Edição excluída com sucesso." });
});

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
