const asyncHandler = require("../utils/asyncHandler");
const {
  configuracaoMonitoriaSchema,
  decisaoMonitoriaSchema,
  decisaoEmLoteSchema,
} = require("../validators/monitoria.validators");
const monitoriaService = require("../services/monitoria.service");

const listar = asyncHandler(async (req, res) => {
  const dados = await monitoriaService.listar(req.params.edicaoId);
  return res.json(dados);
});

const atualizarConfiguracao = asyncHandler(async (req, res) => {
  const dados = configuracaoMonitoriaSchema.parse(req.body);
  const edicao = await monitoriaService.atualizarConfiguracao(req.params.edicaoId, dados);
  return res.json({ edicao, mensagem: "Configurações da monitoria salvas." });
});

const definirStatus = asyncHandler(async (req, res) => {
  const dados = decisaoMonitoriaSchema.parse(req.body);
  const inscricao = await monitoriaService.definirStatus(req.params.edicaoId, req.params.id, dados);
  return res.json({ inscricao, mensagem: "Situação atualizada." });
});

const definirStatusEmLote = asyncHandler(async (req, res) => {
  const { ids, status } = decisaoEmLoteSchema.parse(req.body);
  const total = await monitoriaService.definirStatusEmLote(req.params.edicaoId, ids, status);
  return res.json({ mensagem: `${total} ${total === 1 ? "inscrição atualizada" : "inscrições atualizadas"}.` });
});

const urlAutorizacao = asyncHandler(async (req, res) => {
  const url = await monitoriaService.urlAutorizacao(req.params.edicaoId, req.params.id);
  return res.json({ url });
});

const divulgar = asyncHandler(async (req, res) => {
  await monitoriaService.divulgar(req.params.edicaoId);
  return res.json({ mensagem: "Resultado divulgado. Os e-mails estão sendo enviados em segundo plano." });
});

const reenviarPendentes = asyncHandler(async (req, res) => {
  await monitoriaService.reenviarPendentes(req.params.edicaoId);
  return res.json({ mensagem: "Envio dos e-mails pendentes iniciado." });
});

module.exports = {
  listar,
  atualizarConfiguracao,
  definirStatus,
  definirStatusEmLote,
  urlAutorizacao,
  divulgar,
  reenviarPendentes,
};
