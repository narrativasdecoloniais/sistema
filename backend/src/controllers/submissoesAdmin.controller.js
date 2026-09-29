const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const edicoesService = require("../services/edicoes.service");
const submissoesAdminService = require("../services/submissoesAdmin.service");
const {
  conteudoSubmissaoSchema,
  imagemSubmissaoSchema,
  areaSubmissaoAdminSchema,
} = require("../validators/submissoesAdmin.validators");

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

const alterarArea = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const { areaSubmissaoId } = areaSubmissaoAdminSchema.parse(req.body);
  const submissao = await submissoesAdminService.alterarArea(
    req.params.edicaoId,
    req.params.id,
    areaSubmissaoId,
    req.usuario.id
  );
  return res.json({ submissao });
});

const buscarConteudo = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const submissao = await submissoesAdminService.buscarParaEdicao(req.params.edicaoId, req.params.id);
  return res.json({ submissao });
});

const salvarConteudo = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const dados = conteudoSubmissaoSchema.parse(req.body);
  const submissao = await submissoesAdminService.salvarConteudo(
    req.params.edicaoId,
    req.params.id,
    dados,
    req.usuario.id
  );
  return res.json({ submissao });
});

const enviarImagem = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const { imagem } = imagemSubmissaoSchema.parse(req.body);
  const url = await submissoesAdminService.enviarImagem(req.params.edicaoId, req.params.id, imagem);
  return res.status(201).json({ url });
});

module.exports = { listar, excluir, alterarArea, buscarConteudo, salvarConteudo, enviarImagem };
