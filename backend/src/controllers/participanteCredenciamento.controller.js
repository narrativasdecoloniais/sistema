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

// Crachá virtual: QR code próprio que a equipe lê para credenciar.
const meuCracha = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarEdicaoAtual();
  return res.json(await credenciamentoService.meuCracha(req.usuario.id, edicao));
});

const novoCracha = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarEdicaoAtual();
  const cracha = await credenciamentoService.meuCracha(req.usuario.id, edicao, { novo: true });
  return res.json({ ...cracha, mensagem: "Novo crachá gerado. O anterior deixou de funcionar." });
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

module.exports = { minhaSituacao, meuCracha, novoCracha, previa, credenciarEvento, registrarPresenca };
