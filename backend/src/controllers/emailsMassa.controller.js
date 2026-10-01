const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const emailsMassaService = require("../services/emailsMassa.service");
const usuariosService = require("../services/usuarios.service");
const { modeloEmailSchema, testeEmailSchema, envioEmailSchema } = require("../validators/emailsMassa.validators");

const listarModelos = asyncHandler(async (req, res) => {
  return res.json({ modelos: await emailsMassaService.listarModelos() });
});

const criarModelo = asyncHandler(async (req, res) => {
  const dados = modeloEmailSchema.parse(req.body);
  return res.status(201).json({ modelo: await emailsMassaService.criarModelo(dados) });
});

const atualizarModelo = asyncHandler(async (req, res) => {
  const dados = modeloEmailSchema.parse(req.body);
  return res.json({ modelo: await emailsMassaService.atualizarModelo(req.params.id, dados) });
});

const excluirModelo = asyncHandler(async (req, res) => {
  await emailsMassaService.excluirModelo(req.params.id);
  return res.status(204).end();
});

const enviarTeste = asyncHandler(async (req, res) => {
  const dados = testeEmailSchema.parse(req.body);
  const usuario = await usuariosService.buscarCompletoPorId(req.usuario.id);
  await emailsMassaService.enviarTeste(usuario, dados);
  return res.json({ mensagem: `E-mail de teste enviado para ${usuario.email}.` });
});

const usoMensal = asyncHandler(async (req, res) => {
  return res.json(await emailsMassaService.usoMensal());
});

const listarEnvios = asyncHandler(async (req, res) => {
  if (!req.query.edicaoId) throw new ErroHttp(400, "Informe a edição.");
  return res.json({ envios: await emailsMassaService.listarEnvios(String(req.query.edicaoId)) });
});

const detalharEnvio = asyncHandler(async (req, res) => {
  return res.json({ envio: await emailsMassaService.detalharEnvio(req.params.id) });
});

const criarEnvio = asyncHandler(async (req, res) => {
  const dados = envioEmailSchema.parse(req.body);
  const envio = await emailsMassaService.criarEnvio(dados, req.usuario.id);
  console.log(`[emails-massa] ${req.usuario.id} iniciou o envio ${envio.id} para ${envio.total} destinatários`);
  return res.status(201).json({ envio });
});

const retomarEnvio = asyncHandler(async (req, res) => {
  return res.json(await emailsMassaService.retomar(req.params.id));
});

module.exports = {
  listarModelos,
  criarModelo,
  atualizarModelo,
  excluirModelo,
  enviarTeste,
  usoMensal,
  listarEnvios,
  detalharEnvio,
  criarEnvio,
  retomarEnvio,
};
