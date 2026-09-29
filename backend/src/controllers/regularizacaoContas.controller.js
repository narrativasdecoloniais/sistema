const asyncHandler = require("../utils/asyncHandler");
const regularizacaoService = require("../services/regularizacaoContas.service");
const {
  buscaRegularizacaoSchema,
  planoRegularizacaoSchema,
  confirmarRegularizacaoSchema,
} = require("../validators/regularizacaoContas.validators");

const buscar = asyncHandler(async (req, res) => {
  const { nome } = buscaRegularizacaoSchema.parse(req.body);
  const contas = await regularizacaoService.buscarContasPorNome(nome);
  return res.json({ contas });
});

const previa = asyncHandler(async (req, res) => {
  const dados = planoRegularizacaoSchema.parse(req.body);
  return res.json({ plano: await regularizacaoService.previa(dados) });
});

const enviarCodigos = asyncHandler(async (req, res) => {
  const dados = planoRegularizacaoSchema.parse(req.body);
  return res.json({ plano: await regularizacaoService.enviarCodigos(dados) });
});

const confirmar = asyncHandler(async (req, res) => {
  const dados = confirmarRegularizacaoSchema.parse(req.body);
  return res.json(await regularizacaoService.confirmar(dados));
});

module.exports = { buscar, previa, enviarCodigos, confirmar };
