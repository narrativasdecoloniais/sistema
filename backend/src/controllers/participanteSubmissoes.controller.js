const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const prisma = require("../config/prisma");
const INCLUDE_PADRAO = require("../utils/submissaoIncludePadrao");
const { criarSubmissaoSchema, verificarEmailAutorSchema } = require("../validators/submissoes.validators");
const usuariosService = require("../services/usuarios.service");
const edicoesService = require("../services/edicoes.service");
const submissoesService = require("../services/submissoes.service");

const listarMinhas = asyncHandler(async (req, res) => {
  const submissoes = await prisma.submissao.findMany({
    where: { autores: { some: { usuarioId: req.usuario.id } } },
    include: { ...INCLUDE_PADRAO, edicao: { select: { id: true, nome: true, numero: true } } },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ submissoes });
});

const criar = asyncHandler(async (req, res) => {
  const dados = criarSubmissaoSchema.parse(req.body);
  const edicao = await edicoesService.buscarEdicaoAtual();
  if (!edicao) throw new ErroHttp(404, "Nenhuma edição encontrada.");

  const submissao = await submissoesService.criarSubmissao(req.usuario.id, edicao.id, dados);
  return res.status(201).json({ submissao });
});

const verificarEmailAutor = asyncHandler(async (req, res) => {
  const dados = verificarEmailAutorSchema.parse(req.body);
  const nome = await usuariosService.buscarNomePublicoPorEmail(dados.email);
  return res.json({ nome });
});

module.exports = {
  listarMinhas,
  criar,
  verificarEmailAutor,
};
