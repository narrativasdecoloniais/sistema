const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const { tipoAtividadeSchema } = require("../validators/tiposAtividade.validators");
const tiposAtividadeService = require("../services/tiposAtividade.service");

const listar = asyncHandler(async (req, res) => {
  const tiposAtividade = await tiposAtividadeService.listarTiposAtividade();
  return res.json({ tiposAtividade });
});

const buscarPorId = asyncHandler(async (req, res) => {
  const tipoAtividade = await tiposAtividadeService.buscarPorId(req.params.id);
  if (!tipoAtividade) throw new ErroHttp(404, "Tipo de atividade não encontrado.");
  return res.json({ tipoAtividade });
});

const criar = asyncHandler(async (req, res) => {
  const dados = tipoAtividadeSchema.parse(req.body);
  const tipoAtividade = await tiposAtividadeService.criarTipoAtividade(dados);
  return res.status(201).json({ tipoAtividade });
});

const atualizar = asyncHandler(async (req, res) => {
  const existente = await tiposAtividadeService.buscarPorId(req.params.id);
  if (!existente) throw new ErroHttp(404, "Tipo de atividade não encontrado.");
  const dados = tipoAtividadeSchema.parse(req.body);
  const tipoAtividade = await tiposAtividadeService.atualizarTipoAtividade(req.params.id, dados);
  return res.json({ tipoAtividade });
});

const excluir = asyncHandler(async (req, res) => {
  const existente = await tiposAtividadeService.buscarPorId(req.params.id);
  if (!existente) throw new ErroHttp(404, "Tipo de atividade não encontrado.");
  await tiposAtividadeService.excluirTipoAtividade(req.params.id);
  return res.json({ mensagem: "Tipo de atividade excluído com sucesso." });
});

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
