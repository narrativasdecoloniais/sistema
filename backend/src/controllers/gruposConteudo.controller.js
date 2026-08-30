const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const { grupoConteudoSchema } = require("../validators/gruposConteudo.validators");
const gruposConteudoService = require("../services/gruposConteudo.service");
const edicoesService = require("../services/edicoes.service");

async function garantirEdicao(edicaoId) {
  const edicao = await edicoesService.buscarPorId(edicaoId);
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
}

const listar = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const grupos = await gruposConteudoService.listarGrupos(req.params.edicaoId);
  return res.json({ grupos });
});

const buscarPorId = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const grupo = await gruposConteudoService.buscarPorId(req.params.edicaoId, req.params.id);
  if (!grupo) throw new ErroHttp(404, "Grupo não encontrado.");
  return res.json({ grupo });
});

const criar = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const dados = grupoConteudoSchema.parse(req.body);
  const grupo = await gruposConteudoService.criarGrupo(req.params.edicaoId, dados);
  return res.status(201).json({ grupo });
});

const atualizar = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const existente = await gruposConteudoService.buscarPorId(req.params.edicaoId, req.params.id);
  if (!existente) throw new ErroHttp(404, "Grupo não encontrado.");
  const dados = grupoConteudoSchema.parse(req.body);
  const grupo = await gruposConteudoService.atualizarGrupo(req.params.id, dados);
  return res.json({ grupo });
});

const excluir = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const existente = await gruposConteudoService.buscarPorId(req.params.edicaoId, req.params.id);
  if (!existente) throw new ErroHttp(404, "Grupo não encontrado.");
  await gruposConteudoService.excluirGrupo(req.params.id);
  return res.json({ mensagem: "Grupo excluído com sucesso." });
});

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
