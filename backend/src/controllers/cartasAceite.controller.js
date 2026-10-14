const { z } = require("zod");
const asyncHandler = require("../utils/asyncHandler");
const { modeloCertificadoSchema, revogacaoSchema, revogacaoEmLoteSchema } = require("../validators/certificados.validators");
const certificadosService = require("../services/certificados.service");
const { DECISOES_CARTA } = require("../utils/criterioCartaAceite");
const { enviarPdf } = require("./certificados.controller");

// Tela Submissões › Carta de aceite (seção SUBMISSOES_RESULTADO): a carta é o
// tipo CARTA_ACEITE dos certificados (certificados.service.js), então tudo
// aqui reusa as funções gerais limitadas a esse tipo.

const TIPOS = certificadosService.TIPOS_CARTA;

const envioEmailSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Selecione ao menos uma carta").max(5000).optional(),
  reenviar: z.boolean().optional().default(false),
});

// Espelhado em frontend/lib/validacao.js (criterioCartaAceiteSchema).
const criterioSchema = z.object({
  decisoes: z
    .array(z.enum(DECISOES_CARTA, { errorMap: () => ({ message: "Status inválido" }) }))
    .min(1, "Escolha pelo menos um status")
    .transform((decisoes) => [...new Set(decisoes)]),
  exigirCorrecaoConcluida: z.boolean(),
});

const plural = (total, singular, pluralTexto) => `${total} ${total === 1 ? singular : pluralTexto}`;

const listar = asyncHandler(async (req, res) => {
  return res.json(await certificadosService.listarCartasAceite(req.params.edicaoId));
});

const salvarModelo = asyncHandler(async (req, res) => {
  const dados = modeloCertificadoSchema("CARTA_ACEITE").parse(req.body);
  const modelo = await certificadosService.salvarModelo(req.params.edicaoId, "CARTA_ACEITE", dados);
  return res.json({ modelo, mensagem: "Modelo da carta de aceite salvo." });
});

const previa = asyncHandler(async (req, res) => {
  const dados = modeloCertificadoSchema("CARTA_ACEITE").parse(req.body);
  const buffer = await certificadosService.previa(req.params.edicaoId, "CARTA_ACEITE", dados);
  return enviarPdf(res, { buffer, nomeArquivo: "previa-carta-de-aceite.pdf" }, { inline: true });
});

const salvarCriterio = asyncHandler(async (req, res) => {
  const dados = criterioSchema.parse(req.body);
  const criterio = await certificadosService.salvarCriterioCartaAceite(req.params.edicaoId, dados);
  return res.json({ criterio, mensagem: "Critério da carta de aceite salvo." });
});

const gerar = asyncHandler(async (req, res) => {
  const { criados, atualizados } = await certificadosService.gerar(req.params.edicaoId, "CARTA_ACEITE");
  const partes = [
    plural(criados, "carta criada", "cartas criadas"),
    ...(atualizados > 0 ? [plural(atualizados, "atualizada", "atualizadas")] : []),
  ];
  return res.json({ criados, atualizados, mensagem: `${partes.join(", ")}.` });
});

const revogar = asyncHandler(async (req, res) => {
  const { motivo } = revogacaoSchema.parse(req.body || {});
  await certificadosService.revogar(req.params.edicaoId, req.params.id, motivo, TIPOS);
  return res.json({ mensagem: "Carta de aceite revogada." });
});

const restaurar = asyncHandler(async (req, res) => {
  await certificadosService.restaurar(req.params.edicaoId, req.params.id, TIPOS);
  return res.json({ mensagem: "Carta de aceite restaurada." });
});

const revogarEmLote = asyncHandler(async (req, res) => {
  const { ids, motivo } = revogacaoEmLoteSchema.parse(req.body);
  const total = await certificadosService.revogarEmLote(req.params.edicaoId, ids, motivo, TIPOS);
  return res.json({ mensagem: `${plural(total, "carta revogada", "cartas revogadas")}.` });
});

const pdf = asyncHandler(async (req, res) => {
  return enviarPdf(res, await certificadosService.pdfAdmin(req.params.edicaoId, req.params.id, TIPOS));
});

const enviarPorEmail = asyncHandler(async (req, res) => {
  const dados = envioEmailSchema.parse(req.body || {});
  const { solicitados, semEmail } = await certificadosService.solicitarEnvioEmail(req.params.edicaoId, {
    ...dados,
    tipos: TIPOS,
  });
  const partes = [
    `${plural(solicitados, "carta será enviada", "cartas serão enviadas")} por e-mail em segundo plano`,
    ...(semEmail > 0 ? [`${semEmail} sem e-mail ${semEmail === 1 ? "ficou" : "ficaram"} de fora`] : []),
  ];
  return res.json({ solicitados, semEmail, mensagem: `${partes.join("; ")}.` });
});

const retomarEnvioEmail = asyncHandler(async (req, res) => {
  const total = await certificadosService.retomarEnvioEmail(req.params.edicaoId, TIPOS);
  return res.json({ mensagem: `Envio retomado: ${plural(total, "carta pendente", "cartas pendentes")}.` });
});

module.exports = {
  listar,
  salvarModelo,
  previa,
  salvarCriterio,
  gerar,
  revogar,
  restaurar,
  revogarEmLote,
  pdf,
  enviarPorEmail,
  retomarEnvioEmail,
};
