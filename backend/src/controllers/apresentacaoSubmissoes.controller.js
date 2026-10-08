const asyncHandler = require("../utils/asyncHandler");
const apresentacaoService = require("../services/apresentacaoSubmissoes.service");
const {
  vincularSchema,
  desvincularSchema,
  reordenarSchema,
  distribuirSchema,
  publicacaoSchema,
} = require("../validators/apresentacaoSubmissoes.validators");

const listar = asyncHandler(async (req, res) => {
  return res.json(await apresentacaoService.listar(req.params.edicaoId));
});

const vincular = asyncHandler(async (req, res) => {
  const dados = vincularSchema.parse(req.body);
  const movidos = await apresentacaoService.vincular(req.params.edicaoId, dados);
  return res.json({
    movidos,
    mensagem:
      movidos === 0
        ? "Os trabalhos selecionados já estavam nessa atividade."
        : `${movidos} ${movidos === 1 ? "trabalho vinculado" : "trabalhos vinculados"} à atividade.`,
  });
});

const desvincular = asyncHandler(async (req, res) => {
  const { submissaoIds } = desvincularSchema.parse(req.body);
  const removidos = await apresentacaoService.desvincular(req.params.edicaoId, { submissaoIds });
  return res.json({
    removidos,
    mensagem: `${removidos} ${removidos === 1 ? "trabalho removido" : "trabalhos removidos"} da atividade.`,
  });
});

const reordenar = asyncHandler(async (req, res) => {
  const { submissaoIds } = reordenarSchema.parse(req.body);
  await apresentacaoService.reordenar(req.params.edicaoId, req.params.atividadeId, submissaoIds);
  return res.json({ mensagem: "Ordem de apresentação atualizada." });
});

const distribuirPelaArea = asyncHandler(async (req, res) => {
  const { simular } = distribuirSchema.parse(req.body);
  const resultado = await apresentacaoService.distribuirPelaArea(req.params.edicaoId, { simular });
  return res.json(resultado);
});

const publicar = asyncHandler(async (req, res) => {
  const { publicar: publicarDistribuicao } = publicacaoSchema.parse(req.body);
  const estado = await apresentacaoService.publicar(req.params.edicaoId, publicarDistribuicao);
  return res.json({
    ...estado,
    mensagem: publicarDistribuicao
      ? "Distribuição liberada para os autores em Minhas submissões."
      : "Distribuição ocultada dos autores e do público.",
  });
});

const publicarAoPublico = asyncHandler(async (req, res) => {
  const { publicar: divulgar } = publicacaoSchema.parse(req.body);
  const publicaEm = await apresentacaoService.publicarAoPublico(req.params.edicaoId, divulgar);
  return res.json({
    publicaEm,
    mensagem: divulgar
      ? "Distribuição divulgada na página pública de cada atividade."
      : "Distribuição ocultada do público. Os autores continuam vendo.",
  });
});

const enviarAvisos = asyncHandler(async (req, res) => {
  await apresentacaoService.iniciarAvisos(req.params.edicaoId);
  return res.status(202).json({ mensagem: "Envio dos avisos iniciado." });
});

module.exports = {
  listar,
  vincular,
  desvincular,
  reordenar,
  distribuirPelaArea,
  publicar,
  publicarAoPublico,
  enviarAvisos,
};
