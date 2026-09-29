const { z } = require("zod");
const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const credenciamentoService = require("../services/credenciamento.service");
const edicoesService = require("../services/edicoes.service");

const presencaSchema = z.object({
  inscrever: z.boolean().optional(),
  trocar: z.boolean().optional(),
});

// Situação do participante na edição atual (tela "Credenciamento").
const minhaSituacao = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarEdicaoAtual();
  if (!edicao) throw new ErroHttp(404, "Nenhuma edição encontrada.");
  const situacao = await credenciamentoService.minhaSituacao(req.usuario.id, edicao.id);
  return res.json({ edicao: { id: edicao.id, nome: edicao.nome }, ...situacao });
});

const previa = asyncHandler(async (req, res) => {
  const dados = await credenciamentoService.previa(req.usuario.id, req.params.token);
  return res.json(dados);
});

const credenciarEvento = asyncHandler(async (req, res) => {
  const resultado = await credenciamentoService.credenciarEvento(req.usuario.id, req.params.token);
  return res.json(resultado);
});

const registrarPresenca = asyncHandler(async (req, res) => {
  const opcoes = presencaSchema.parse(req.body || {});
  const resultado = await credenciamentoService.registrarPresenca(req.usuario.id, req.params.token, opcoes);
  return res.json(resultado);
});

module.exports = { minhaSituacao, previa, credenciarEvento, registrarPresenca };
