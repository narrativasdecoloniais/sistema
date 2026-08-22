const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const { programaPosGraduacaoSchema } = require("../validators/programasPosGraduacao.validators");
const programasPosGraduacaoService = require("../services/programasPosGraduacao.service");

const listar = asyncHandler(async (req, res) => {
  const programas = await programasPosGraduacaoService.listarProgramasPosGraduacao();
  return res.json({ programas });
});

const buscarPorId = asyncHandler(async (req, res) => {
  const programa = await programasPosGraduacaoService.buscarPorId(req.params.id);
  if (!programa) throw new ErroHttp(404, "Programa de pós-graduação não encontrado.");
  return res.json({ programa });
});

const criar = asyncHandler(async (req, res) => {
  const dados = programaPosGraduacaoSchema.parse(req.body);
  const programa = await programasPosGraduacaoService.criarPrograma(dados);
  return res.status(201).json({ programa });
});

const atualizar = asyncHandler(async (req, res) => {
  const existente = await programasPosGraduacaoService.buscarPorId(req.params.id);
  if (!existente) throw new ErroHttp(404, "Programa de pós-graduação não encontrado.");
  const dados = programaPosGraduacaoSchema.parse(req.body);
  const programa = await programasPosGraduacaoService.atualizarPrograma(req.params.id, dados);
  return res.json({ programa });
});

const excluir = asyncHandler(async (req, res) => {
  const existente = await programasPosGraduacaoService.buscarPorId(req.params.id);
  if (!existente) throw new ErroHttp(404, "Programa de pós-graduação não encontrado.");
  await programasPosGraduacaoService.excluirPrograma(req.params.id);
  return res.json({ mensagem: "Programa de pós-graduação excluído com sucesso." });
});

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
