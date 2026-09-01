const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const edicoesService = require("../services/edicoes.service");
const submissoesAdminService = require("../services/submissoesAdmin.service");

async function garantirEdicao(edicaoId) {
  const edicao = await edicoesService.buscarPorId(edicaoId);
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
}

const listar = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const modalidadeSubmissaoId = req.query.modalidadeSubmissaoId
    ? String(req.query.modalidadeSubmissaoId)
    : undefined;
  const areaSubmissaoId = req.query.areaSubmissaoId ? String(req.query.areaSubmissaoId) : undefined;
  const submissoes = await submissoesAdminService.listarPorEdicao(req.params.edicaoId, {
    modalidadeSubmissaoId,
    areaSubmissaoId,
  });
  return res.json({ submissoes });
});

const excluir = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const existente = await submissoesAdminService.buscarPorId(req.params.id);
  if (!existente || existente.edicaoId !== req.params.edicaoId) {
    throw new ErroHttp(404, "Submissão não encontrada.");
  }
  await submissoesAdminService.excluir(req.params.id);
  return res.json({ mensagem: "Submissão excluída com sucesso." });
});

module.exports = { listar, excluir };
