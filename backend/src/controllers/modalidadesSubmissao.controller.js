const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const { modalidadeSubmissaoSchema } = require("../validators/modalidadesSubmissao.validators");
const modalidadesSubmissaoService = require("../services/modalidadesSubmissao.service");
const edicoesService = require("../services/edicoes.service");

async function garantirEdicao(edicaoId) {
  const edicao = await edicoesService.buscarPorId(edicaoId);
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
}

const listar = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const modalidades = await modalidadesSubmissaoService.listarModalidades(req.params.edicaoId);
  return res.json({ modalidades });
});

const buscarPorId = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const modalidade = await modalidadesSubmissaoService.buscarPorId(req.params.edicaoId, req.params.id);
  if (!modalidade) throw new ErroHttp(404, "Modalidade de submissão não encontrada.");
  return res.json({ modalidade });
});

const criar = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const dados = modalidadeSubmissaoSchema.parse(req.body);
  const modalidade = await modalidadesSubmissaoService.criarModalidade(req.params.edicaoId, dados);
  return res.status(201).json({ modalidade });
});

const atualizar = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const existente = await modalidadesSubmissaoService.buscarPorId(req.params.edicaoId, req.params.id);
  if (!existente) throw new ErroHttp(404, "Modalidade de submissão não encontrada.");
  const dados = modalidadeSubmissaoSchema.parse(req.body);
  const modalidade = await modalidadesSubmissaoService.atualizarModalidade(req.params.id, dados);
  return res.json({ modalidade });
});

const excluir = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const existente = await modalidadesSubmissaoService.buscarPorId(req.params.edicaoId, req.params.id);
  if (!existente) throw new ErroHttp(404, "Modalidade de submissão não encontrada.");
  await modalidadesSubmissaoService.excluirModalidade(req.params.id);
  return res.json({ mensagem: "Modalidade de submissão excluída com sucesso." });
});

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
