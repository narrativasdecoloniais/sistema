const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const { atividadeSchema, atividadeHorarioSchema } = require("../validators/atividades.validators");
const atividadesService = require("../services/atividades.service");
const edicoesService = require("../services/edicoes.service");
const tiposAtividadeService = require("../services/tiposAtividade.service");
const tiposParticipacaoService = require("../services/tiposParticipacao.service");

async function garantirEdicao(edicaoId) {
  const edicao = await edicoesService.buscarPorId(edicaoId);
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
}

async function garantirTipoAtividade(tipoAtividadeId) {
  const tipoAtividade = await tiposAtividadeService.buscarPorId(tipoAtividadeId);
  if (!tipoAtividade) throw new ErroHttp(404, "Tipo de atividade não encontrado.");
}

async function garantirTiposParticipacao(pessoas = []) {
  for (const pessoa of pessoas) {
    if (!pessoa.tipoParticipacaoId) continue;
    const tipoParticipacao = await tiposParticipacaoService.buscarPorId(pessoa.tipoParticipacaoId);
    if (!tipoParticipacao) throw new ErroHttp(404, "Tipo de participação não encontrado.");
  }
}

const listar = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const atividades = await atividadesService.listarAtividades(req.params.edicaoId);
  return res.json({ atividades });
});

const buscarPorId = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const atividade = await atividadesService.buscarPorId(req.params.edicaoId, req.params.id);
  if (!atividade) throw new ErroHttp(404, "Atividade não encontrada.");
  return res.json({ atividade });
});

const criar = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const dados = atividadeSchema.parse(req.body);
  await garantirTipoAtividade(dados.tipoAtividadeId);
  await garantirTiposParticipacao(dados.pessoas);
  const atividade = await atividadesService.criarAtividade(req.params.edicaoId, dados);
  return res.status(201).json({ atividade });
});

const atualizar = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const existente = await atividadesService.buscarPorId(req.params.edicaoId, req.params.id);
  if (!existente) throw new ErroHttp(404, "Atividade não encontrada.");
  const dados = atividadeSchema.parse(req.body);
  await garantirTipoAtividade(dados.tipoAtividadeId);
  await garantirTiposParticipacao(dados.pessoas);
  const atividade = await atividadesService.atualizarAtividade(req.params.id, dados);
  return res.json({ atividade });
});

const atualizarHorario = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const existente = await atividadesService.buscarPorId(req.params.edicaoId, req.params.id);
  if (!existente) throw new ErroHttp(404, "Atividade não encontrada.");
  const dados = atividadeHorarioSchema.parse(req.body);
  const atividade = await atividadesService.atualizarHorario(req.params.id, dados);
  return res.json({ atividade });
});

const excluir = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const existente = await atividadesService.buscarPorId(req.params.edicaoId, req.params.id);
  if (!existente) throw new ErroHttp(404, "Atividade não encontrada.");
  await atividadesService.excluirAtividade(req.params.id);
  return res.json({ mensagem: "Atividade excluída com sucesso." });
});

module.exports = { listar, buscarPorId, criar, atualizar, atualizarHorario, excluir };
