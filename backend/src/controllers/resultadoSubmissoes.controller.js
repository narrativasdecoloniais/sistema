const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/prisma");
const resultadoService = require("../services/resultadoSubmissoes.service");
const emailResultadoService = require("../services/emailResultado.service");
const {
  observacaoSchema,
  prazoSchema,
  conferirCorrecaoSchema,
  decisaoParamSchema,
  modeloEmailSchema,
  enviarEmailsSchema,
} = require("../validators/resultadoSubmissoes.validators");

const resumo = asyncHandler(async (req, res) => {
  return res.json({ resumo: await resultadoService.resumo(req.params.edicaoId) });
});

const listarTrabalhos = asyncHandler(async (req, res) => {
  return res.json({ trabalhos: await resultadoService.listarTrabalhos(req.params.edicaoId) });
});

const atualizarObservacao = asyncHandler(async (req, res) => {
  const { observacao } = observacaoSchema.parse(req.body);
  const submissao = await resultadoService.atualizarObservacao(req.params.edicaoId, req.params.id, observacao);
  return res.json({ submissao });
});

const conferirCorrecao = asyncHandler(async (req, res) => {
  const dados = conferirCorrecaoSchema.parse(req.body);
  const submissao = await resultadoService.conferirCorrecao(req.params.edicaoId, req.params.id, dados);
  return res.json({
    submissao,
    mensagem: dados.aceitar ? "Correção aceita." : "Correção devolvida ao autor principal.",
  });
});

const definirPrazo = asyncHandler(async (req, res) => {
  const { prazo } = prazoSchema.parse(req.body);
  return res.json({ prazo: await resultadoService.definirPrazo(req.params.edicaoId, prazo) });
});

const divulgar = asyncHandler(async (req, res) => {
  await resultadoService.divulgar(req.params.edicaoId);
  return res.status(202).json({
    mensagem: "Resultado divulgado. Nenhum e-mail foi enviado aos autores.",
  });
});

const previaEmails = asyncHandler(async (req, res) => {
  return res.json({ previa: await resultadoService.previaEmails(req.params.edicaoId) });
});

const enviarEmails = asyncHandler(async (req, res) => {
  const dados = enviarEmailsSchema.parse(req.body || {});
  await resultadoService.enviarEmails(req.params.edicaoId, dados);
  return res.status(202).json({ mensagem: "Envio dos e-mails iniciado." });
});

const listarModelosEmail = asyncHandler(async (req, res) => {
  return res.json({
    modelos: await emailResultadoService.listarModelos(req.params.edicaoId),
    marcadores: emailResultadoService.MARCADORES,
  });
});

const salvarModeloEmail = asyncHandler(async (req, res) => {
  const decisao = decisaoParamSchema.parse(req.params.decisao);
  const dados = modeloEmailSchema.parse(req.body);
  const modelo = await emailResultadoService.salvarModelo(req.params.edicaoId, decisao, dados);
  return res.json({ modelo });
});

const enviarTesteEmail = asyncHandler(async (req, res) => {
  const decisao = decisaoParamSchema.parse(req.params.decisao);
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuario.id },
    select: { nome: true, email: true },
  });
  await emailResultadoService.enviarTeste(req.params.edicaoId, decisao, usuario);
  return res.json({ mensagem: `E-mail de teste enviado para ${usuario.email}.` });
});

module.exports = {
  resumo,
  listarTrabalhos,
  atualizarObservacao,
  conferirCorrecao,
  definirPrazo,
  divulgar,
  previaEmails,
  enviarEmails,
  listarModelosEmail,
  salvarModeloEmail,
  enviarTesteEmail,
};
