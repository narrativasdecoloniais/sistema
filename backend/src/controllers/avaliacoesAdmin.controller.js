const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const edicoesService = require("../services/edicoes.service");
const avaliacoesService = require("../services/avaliacoes.service");
const {
  adicionarAvaliadorSchema,
  atualizarAvaliadorSchema,
  atribuirAvaliadorSchema,
  decisaoFinalSchema,
  resolverSugestaoSchema,
} = require("../validators/avaliacoes.validators");

async function garantirEdicao(edicaoId) {
  const edicao = await edicoesService.buscarPorId(edicaoId);
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
}

const listarAvaliadores = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const avaliadores = await avaliacoesService.listarAvaliadores(req.params.edicaoId);
  return res.json({ avaliadores });
});

const adicionarAvaliador = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const dados = adicionarAvaliadorSchema.parse(req.body);
  const avaliador = await avaliacoesService.adicionarAvaliador(req.params.edicaoId, dados);
  return res.status(201).json({ avaliador });
});

const atualizarAvaliador = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const { areaIds } = atualizarAvaliadorSchema.parse(req.body);
  const avaliador = await avaliacoesService.atualizarAreasAvaliador(req.params.edicaoId, req.params.id, areaIds);
  return res.json({ avaliador });
});

const removerAvaliador = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  await avaliacoesService.removerAvaliador(req.params.edicaoId, req.params.id);
  return res.json({ mensagem: "Avaliador removido com sucesso." });
});

const listarSubmissoes = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const submissoes = await avaliacoesService.listarSubmissoes(req.params.edicaoId);
  return res.json({ submissoes });
});

const atribuir = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const dados = atribuirAvaliadorSchema.parse(req.body);
  const resultado = await avaliacoesService.atribuirManual(req.params.edicaoId, dados);
  return res.status(201).json(resultado);
});

const removerAtribuicao = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  await avaliacoesService.removerAtribuicao(req.params.edicaoId, req.params.id);
  return res.json({ mensagem: "Atribuição removida com sucesso." });
});

const definirDecisaoFinal = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const { decisao } = decisaoFinalSchema.parse(req.body);
  const submissao = await avaliacoesService.definirDecisaoFinal(
    req.params.edicaoId,
    req.params.id,
    decisao,
    req.usuario.id
  );
  return res.json({ submissao });
});

const listarSugestoes = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const sugestoes = await avaliacoesService.listarSugestoes(req.params.edicaoId);
  return res.json({ sugestoes });
});

const resolverSugestao = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const { aprovar } = resolverSugestaoSchema.parse(req.body);
  await avaliacoesService.resolverSugestao(req.params.edicaoId, req.params.id, aprovar, req.usuario.id);
  return res.json({
    mensagem: aprovar
      ? "Troca de área aprovada. O trabalho foi redistribuído aos avaliadores da nova área."
      : "Sugestão recusada.",
  });
});

module.exports = {
  listarAvaliadores,
  adicionarAvaliador,
  atualizarAvaliador,
  removerAvaliador,
  listarSubmissoes,
  atribuir,
  removerAtribuicao,
  definirDecisaoFinal,
  listarSugestoes,
  resolverSugestao,
};
