const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const {
  criarInscricaoAtividadeSchema,
  atualizarInscricaoAtividadeSchema,
} = require("../validators/inscricoesAtividade.validators");
const edicoesService = require("../services/edicoes.service");
const usuariosService = require("../services/usuarios.service");
const atividadesService = require("../services/atividades.service");
const inscricoesAtividadeService = require("../services/inscricoesAtividade.service");

async function garantirEdicao(edicaoId) {
  const edicao = await edicoesService.buscarPorId(edicaoId);
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
}

const listar = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const atividadeId = req.query.atividadeId ? String(req.query.atividadeId) : undefined;
  const inscricoes = await inscricoesAtividadeService.listarPorEdicao(req.params.edicaoId, {
    atividadeId,
  });
  return res.json({ inscricoes });
});

const criar = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const dados = criarInscricaoAtividadeSchema.parse(req.body);

  const usuario = await usuariosService.buscarCompletoPorId(dados.usuarioId);
  if (!usuario) throw new ErroHttp(404, "Usuário não encontrado.");

  const atividade = await atividadesService.buscarPorId(req.params.edicaoId, dados.atividadeId);
  if (!atividade) throw new ErroHttp(404, "Atividade não encontrada.");

  const inscricao = await inscricoesAtividadeService.criar(dados);
  return res.status(201).json({ inscricao });
});

const atualizar = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const existente = await inscricoesAtividadeService.buscarPorId(req.params.id);
  if (!existente || existente.atividade.edicaoId !== req.params.edicaoId) {
    throw new ErroHttp(404, "Inscrição não encontrada.");
  }

  const { status } = atualizarInscricaoAtividadeSchema.parse(req.body);
  const inscricao = await inscricoesAtividadeService.atualizarStatus(req.params.id, status);
  return res.json({ inscricao });
});

const excluir = asyncHandler(async (req, res) => {
  await garantirEdicao(req.params.edicaoId);
  const existente = await inscricoesAtividadeService.buscarPorId(req.params.id);
  if (!existente || existente.atividade.edicaoId !== req.params.edicaoId) {
    throw new ErroHttp(404, "Inscrição não encontrada.");
  }
  await inscricoesAtividadeService.excluir(req.params.id);
  return res.json({ mensagem: "Inscrição excluída com sucesso." });
});

module.exports = { listar, criar, atualizar, excluir };
