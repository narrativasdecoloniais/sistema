const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/prisma");
const apresentacaoService = require("../services/apresentacaoSubmissoes.service");
const emailApresentacaoService = require("../services/emailApresentacao.service");
const {
  vincularSchema,
  desvincularSchema,
  reordenarSchema,
  distribuirSchema,
  publicacaoSchema,
  modeloEmailSchema,
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

// edicao.nome alimenta a pré-visualização no admin.
const buscarModeloEmail = asyncHandler(async (req, res) => {
  const [modelo, edicao] = await Promise.all([
    emailApresentacaoService.buscarModelo(req.params.edicaoId),
    prisma.edicao.findUnique({ where: { id: req.params.edicaoId }, select: { nome: true } }),
  ]);
  return res.json({ modelo, edicao, marcadores: emailApresentacaoService.MARCADORES });
});

const salvarModeloEmail = asyncHandler(async (req, res) => {
  const dados = modeloEmailSchema.parse(req.body);
  const modelo = await emailApresentacaoService.salvarModelo(req.params.edicaoId, dados);
  return res.json({ modelo, mensagem: "Texto do aviso salvo." });
});

const restaurarModeloEmail = asyncHandler(async (req, res) => {
  const modelo = await emailApresentacaoService.restaurarPadrao(req.params.edicaoId);
  return res.json({ modelo, mensagem: "Texto padrão restaurado." });
});

const enviarTesteEmail = asyncHandler(async (req, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuario.id },
    select: { nome: true, email: true },
  });
  await emailApresentacaoService.enviarTeste(req.params.edicaoId, usuario);
  return res.json({ mensagem: `E-mail de teste enviado para ${usuario.email}.` });
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
  buscarModeloEmail,
  salvarModeloEmail,
  restaurarModeloEmail,
  enviarTesteEmail,
};
