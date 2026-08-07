const { z } = require("zod");
const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const edicoesService = require("../services/edicoes.service");
const usuariosService = require("../services/usuarios.service");
const inscricoesEdicaoService = require("../services/inscricoesEdicao.service");

const criarSchema = z.object({
  usuarioId: z.string().uuid("Selecione um usuário válido"),
});

async function garantirEdicao(edicaoId) {
  const edicao = await edicoesService.buscarPorId(edicaoId);
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
}

const listar = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const inscricoes = await inscricoesEdicaoService.listarPorEdicao(req.params.edicaoId);
  return res.json({ inscricoes });
});

const criar = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const { usuarioId } = criarSchema.parse(req.body);

  const usuario = await usuariosService.buscarCompletoPorId(usuarioId);
  if (!usuario) throw new ErroHttp(404, "Usuário não encontrado.");

  const inscricao = await inscricoesEdicaoService.criar(req.params.edicaoId, usuarioId);
  return res.status(201).json({ inscricao });
});

const excluir = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const existente = await inscricoesEdicaoService.buscarPorId(req.params.id);
  if (!existente || existente.edicaoId !== req.params.edicaoId) {
    throw new ErroHttp(404, "Inscrição não encontrada.");
  }
  await inscricoesEdicaoService.excluir(req.params.id);
  return res.json({ mensagem: "Inscrição excluída com sucesso." });
});

module.exports = { listar, criar, excluir };
