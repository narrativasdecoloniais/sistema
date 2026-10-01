const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const edicoesService = require("../services/edicoes.service");
const coautoresAdminService = require("../services/coautoresAdmin.service");
const convitesCoautorService = require("../services/convitesCoautor.service");
const {
  atualizarCoautorSchema,
  vincularCoautorSchema,
  enviarConvitesSchema,
} = require("../validators/coautores.validators");

async function garantirEdicao(edicaoId) {
  const edicao = await edicoesService.buscarPorId(edicaoId);
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
}

const listar = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const coautores = await coautoresAdminService.listar(req.params.edicaoId);
  return res.json({ coautores, envio: convitesCoautorService.statusEnvio() });
});

const statusEnvio = asyncHandler(async (req, res) => {
  return res.json({ envio: convitesCoautorService.statusEnvio() });
});

const enviarPendentes = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const enfileirados = await convitesCoautorService.enviarPendentesDaEdicao(req.params.edicaoId);
  return res.json({ enfileirados });
});

const enviarEmLote = asyncHandler(async (req, res) => {
  const { autorIds } = enviarConvitesSchema.parse(req.body);
  const enfileirados = await convitesCoautorService.enviarParaAutorias(req.params.edicaoId, autorIds);
  return res.json({ enfileirados });
});

const atualizar = asyncHandler(async (req, res) => {
  const dados = atualizarCoautorSchema.parse(req.body);
  const resultado = await coautoresAdminService.atualizar(req.params.edicaoId, req.params.autorId, dados);
  return res.json(resultado);
});

const vincular = asyncHandler(async (req, res) => {
  const { usuarioId } = vincularCoautorSchema.parse(req.body);
  await coautoresAdminService.vincular(req.params.edicaoId, req.params.autorId, usuarioId);
  return res.status(204).end();
});

const excluir = asyncHandler(async (req, res) => {
  await coautoresAdminService.excluir(req.params.edicaoId, req.params.autorId);
  return res.status(204).end();
});

module.exports = { listar, statusEnvio, enviarPendentes, enviarEmLote, atualizar, vincular, excluir };
