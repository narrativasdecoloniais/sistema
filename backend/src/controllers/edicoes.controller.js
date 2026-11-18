const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const { edicaoSchema } = require("../validators/edicoes.validators");
const edicoesService = require("../services/edicoes.service");
const { acessoMonitorPorEdicao } = require("../utils/acessoMonitor");

const ehEquipe = (usuario) => usuario.papeis.some((papel) => papel === "ADMIN" || papel === "ORGANIZADOR");

const listar = asyncHandler(async (req, res) => {
  const edicoes = await edicoesService.listarEdicoes();
  if (ehEquipe(req.usuario)) return res.json({ edicoes });

  const acesso = await acessoMonitorPorEdicao(req.usuario.id);
  const visiveis = edicoes.filter((edicao) => acesso[edicao.id]);
  if (visiveis.length === 0) throw new ErroHttp(403, "Você não tem permissão para acessar este recurso.");
  return res.json({ edicoes: visiveis.map(({ tokenCredenciamento, ...resto }) => resto) });
});

const buscarPorId = asyncHandler(async (req, res) => {
  const equipe = ehEquipe(req.usuario);
  if (!equipe) {
    const acesso = await acessoMonitorPorEdicao(req.usuario.id);
    if (!acesso[req.params.id]) throw new ErroHttp(403, "Você não tem permissão para acessar este recurso.");
  }
  const edicao = await edicoesService.buscarPorId(req.params.id);
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
  if (equipe) return res.json({ edicao });
  const { tokenCredenciamento, ...semToken } = edicao;
  return res.json({ edicao: semToken });
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
