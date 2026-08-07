const asyncHandler = require("../utils/asyncHandler");
const { organizadorSchema } = require("../validators/organizadores.validators");
const organizadoresService = require("../services/organizadores.service");

const listar = asyncHandler(async (req, res) => {
  const organizadores = await organizadoresService.listarOrganizadores();
  return res.json({ organizadores });
});

const criar = asyncHandler(async (req, res) => {
  const dados = organizadorSchema.parse(req.body);
  const organizador = await organizadoresService.adicionarOrganizador(dados);
  return res.status(201).json({ organizador });
});

const excluir = asyncHandler(async (req, res) => {
  await organizadoresService.removerOrganizador(req.params.id);
  return res.json({ mensagem: "Organizador removido com sucesso." });
});

const promover = asyncHandler(async (req, res) => {
  const organizador = await organizadoresService.promoverAdmin(req.params.id);
  return res.json({ organizador });
});

module.exports = { listar, criar, excluir, promover };
