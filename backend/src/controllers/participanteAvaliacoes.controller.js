const asyncHandler = require("../utils/asyncHandler");
const avaliacoesService = require("../services/avaliacoes.service");
const { decisaoAvaliadorSchema, sugestaoAreaSchema } = require("../validators/avaliacoes.validators");

// Avaliação cega — o service só devolve a projeção sem autores.

const listar = asyncHandler(async (req, res) => {
  const avaliacoes = await avaliacoesService.listarMinhasAtribuicoes(req.usuario.id);
  return res.json({ avaliacoes });
});

const buscar = asyncHandler(async (req, res) => {
  const avaliacao = await avaliacoesService.buscarMinhaAtribuicao(req.params.atribuicaoId, req.usuario.id);
  return res.json({ avaliacao });
});

const registrarDecisao = asyncHandler(async (req, res) => {
  const { decisao } = decisaoAvaliadorSchema.parse(req.body);
  const avaliacao = await avaliacoesService.registrarDecisao(req.params.atribuicaoId, req.usuario.id, decisao);
  return res.json({ avaliacao });
});

const sugerirArea = asyncHandler(async (req, res) => {
  const dados = sugestaoAreaSchema.parse(req.body);
  const avaliacao = await avaliacoesService.sugerirArea(req.params.atribuicaoId, req.usuario.id, dados);
  return res.status(201).json({ avaliacao });
});

module.exports = { listar, buscar, registrarDecisao, sugerirArea };
