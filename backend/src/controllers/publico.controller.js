const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const edicoesService = require("../services/edicoes.service");
const atividadesService = require("../services/atividades.service");

const buscarEdicaoAtual = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarEdicaoAtual();
  if (!edicao) throw new ErroHttp(404, "Nenhuma edição encontrada.");
  return res.json({ edicao });
});

const listarAtividades = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarEdicaoAtual();
  if (!edicao) throw new ErroHttp(404, "Nenhuma edição encontrada.");

  const atividades = await atividadesService.listarAtividades(edicao.id);
  atividades.sort((a, b) => a.nome.localeCompare(b.nome));
  return res.json({ atividades });
});

const buscarAtividadePorSlug = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarEdicaoAtual();
  if (!edicao) throw new ErroHttp(404, "Nenhuma edição encontrada.");

  const atividade = await atividadesService.buscarPorSlug(edicao.id, req.params.slug);
  if (!atividade) throw new ErroHttp(404, "Atividade não encontrada.");
  return res.json({ atividade });
});

module.exports = { buscarEdicaoAtual, listarAtividades, buscarAtividadePorSlug };
