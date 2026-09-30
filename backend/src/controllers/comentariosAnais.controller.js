const asyncHandler = require("../utils/asyncHandler");
const anaisService = require("../services/anais.service");
const { comentarioSchema } = require("../validators/anais.validators");

const criar = asyncHandler(async (req, res) => {
  const dados = comentarioSchema.parse(req.body);
  const comentario = await anaisService.criarComentario(req.usuario.id, req.params.id, dados);
  return res.status(201).json({ comentario, mensagem: "Comentário publicado." });
});

const excluir = asyncHandler(async (req, res) => {
  await anaisService.excluirComentarioProprio(req.usuario.id, req.params.id);
  return res.json({ mensagem: "Comentário excluído." });
});

module.exports = { criar, excluir };
