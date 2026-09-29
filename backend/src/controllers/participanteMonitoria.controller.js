const asyncHandler = require("../utils/asyncHandler");
const monitoriaService = require("../services/monitoria.service");

const buscar = asyncHandler(async (req, res) => {
  const estado = await monitoriaService.buscarMinha(req.usuario.id, req.params.edicaoId);
  return res.json(estado);
});

// A validação depende da edição (catálogo de funções, data do evento), por
// isso o corpo vai cru pro service, que monta o schema.
const salvar = asyncHandler(async (req, res) => {
  const { inscricao, criada } = await monitoriaService.salvar(req.usuario.id, req.params.edicaoId, req.body);
  return res.status(criada ? 201 : 200).json({ inscricao });
});

const cancelar = asyncHandler(async (req, res) => {
  const inscricao = await monitoriaService.cancelar(req.usuario.id, req.params.edicaoId);
  return res.json({ inscricao });
});

module.exports = { buscar, salvar, cancelar };
