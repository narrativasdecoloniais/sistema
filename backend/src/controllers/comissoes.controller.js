const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const { comissaoSchema } = require("../validators/comissoes.validators");
const comissoesService = require("../services/comissoes.service");
const edicoesService = require("../services/edicoes.service");
const tiposComissaoService = require("../services/tiposComissao.service");

async function garantirEdicao(edicaoId) {
  const edicao = await edicoesService.buscarPorId(edicaoId);
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
}

async function garantirTipoComissao(tipoComissaoId) {
  const tipoComissao = await tiposComissaoService.buscarPorId(tipoComissaoId);
  if (!tipoComissao) throw new ErroHttp(404, "Tipo de comissão não encontrado.");
}

const listar = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const comissoes = await comissoesService.listarComissoes(req.params.edicaoId);
  return res.json({ comissoes });
});

const buscarPorId = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const comissao = await comissoesService.buscarPorId(req.params.edicaoId, req.params.id);
  if (!comissao) throw new ErroHttp(404, "Comissão não encontrada.");
  return res.json({ comissao });
});

const criar = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const dados = comissaoSchema.parse(req.body);
  await garantirTipoComissao(dados.tipoComissaoId);
  const comissao = await comissoesService.criarComissao(req.params.edicaoId, dados);
  return res.status(201).json({ comissao });
});

const atualizar = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const existente = await comissoesService.buscarPorId(req.params.edicaoId, req.params.id);
  if (!existente) throw new ErroHttp(404, "Comissão não encontrada.");
  const dados = comissaoSchema.parse(req.body);
  await garantirTipoComissao(dados.tipoComissaoId);
  const comissao = await comissoesService.atualizarComissao(req.params.id, dados);
  return res.json({ comissao });
});

const excluir = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const existente = await comissoesService.buscarPorId(req.params.edicaoId, req.params.id);
  if (!existente) throw new ErroHttp(404, "Comissão não encontrada.");
  await comissoesService.excluirComissao(req.params.id);
  return res.json({ mensagem: "Comissão excluída com sucesso." });
});

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
