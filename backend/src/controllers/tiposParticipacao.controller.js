const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const { tipoParticipacaoSchema } = require("../validators/tiposParticipacao.validators");
const tiposParticipacaoService = require("../services/tiposParticipacao.service");

const listar = asyncHandler(async (req, res) => {
  const tiposParticipacao = await tiposParticipacaoService.listarTiposParticipacao();
  return res.json({ tiposParticipacao });
});

const buscarPorId = asyncHandler(async (req, res) => {
  const tipoParticipacao = await tiposParticipacaoService.buscarPorId(req.params.id);
  if (!tipoParticipacao) throw new ErroHttp(404, "Tipo de participação não encontrado.");
  return res.json({ tipoParticipacao });
});

const criar = asyncHandler(async (req, res) => {
  const dados = tipoParticipacaoSchema.parse(req.body);
  const tipoParticipacao = await tiposParticipacaoService.criarTipoParticipacao(dados);
  return res.status(201).json({ tipoParticipacao });
});

const atualizar = asyncHandler(async (req, res) => {
  const existente = await tiposParticipacaoService.buscarPorId(req.params.id);
  if (!existente) throw new ErroHttp(404, "Tipo de participação não encontrado.");
  const dados = tipoParticipacaoSchema.parse(req.body);
  const tipoParticipacao = await tiposParticipacaoService.atualizarTipoParticipacao(req.params.id, dados);
  return res.json({ tipoParticipacao });
});

const excluir = asyncHandler(async (req, res) => {
  const existente = await tiposParticipacaoService.buscarPorId(req.params.id);
  if (!existente) throw new ErroHttp(404, "Tipo de participação não encontrado.");
  await tiposParticipacaoService.excluirTipoParticipacao(req.params.id);
  return res.json({ mensagem: "Tipo de participação excluído com sucesso." });
});

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
