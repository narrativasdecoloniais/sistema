const asyncHandler = require("../utils/asyncHandler");
const {
  tipoCertificadoSchema,
  modeloCertificadoSchema,
  liberacaoSchema,
  inclusaoManualSchema,
  revogacaoSchema,
  revogacaoEmLoteSchema,
} = require("../validators/certificados.validators");
const certificadosService = require("../services/certificados.service");

function enviarPdf(res, { buffer, nomeArquivo }, { inline = false } = {}) {
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${nomeArquivo}"`,
    "Cache-Control": "no-store",
  });
  return res.send(buffer);
}

const listar = asyncHandler(async (req, res) => {
  return res.json(await certificadosService.listar(req.params.edicaoId));
});

const salvarModelo = asyncHandler(async (req, res) => {
  const tipo = tipoCertificadoSchema.parse(req.params.tipo);
  const dados = modeloCertificadoSchema.parse(req.body);
  const modelo = await certificadosService.salvarModelo(req.params.edicaoId, tipo, dados);
  return res.json({ modelo, mensagem: "Modelo do certificado salvo." });
});

const previa = asyncHandler(async (req, res) => {
  const tipo = tipoCertificadoSchema.parse(req.params.tipo);
  const dados = modeloCertificadoSchema.parse(req.body);
  const buffer = await certificadosService.previa(req.params.edicaoId, tipo, dados);
  return enviarPdf(res, { buffer, nomeArquivo: "previa-certificado.pdf" }, { inline: true });
});

const definirLiberacao = asyncHandler(async (req, res) => {
  const tipo = tipoCertificadoSchema.parse(req.params.tipo);
  const { liberado } = liberacaoSchema.parse(req.body);
  const modelo = await certificadosService.definirLiberacao(req.params.edicaoId, tipo, liberado);
  return res.json({
    modelo,
    mensagem: liberado
      ? "Certificados liberados para download na área do participante."
      : "Certificados ocultados da área do participante.",
  });
});

const gerar = asyncHandler(async (req, res) => {
  const tipo = tipoCertificadoSchema.parse(req.params.tipo);
  const { criados, atualizados } = await certificadosService.gerar(req.params.edicaoId, tipo);
  const partes = [
    `${criados} ${criados === 1 ? "certificado criado" : "certificados criados"}`,
    ...(atualizados > 0 ? [`${atualizados} ${atualizados === 1 ? "atualizado" : "atualizados"}`] : []),
  ];
  return res.json({ criados, atualizados, mensagem: `${partes.join(", ")}.` });
});

const incluirManual = asyncHandler(async (req, res) => {
  const dados = inclusaoManualSchema.parse(req.body);
  await certificadosService.incluirManual(req.params.edicaoId, dados);
  return res.status(201).json({ mensagem: "Certificado incluído." });
});

const revogar = asyncHandler(async (req, res) => {
  const { motivo } = revogacaoSchema.parse(req.body || {});
  await certificadosService.revogar(req.params.edicaoId, req.params.id, motivo);
  return res.json({ mensagem: "Certificado revogado." });
});

const restaurar = asyncHandler(async (req, res) => {
  await certificadosService.restaurar(req.params.edicaoId, req.params.id);
  return res.json({ mensagem: "Certificado restaurado." });
});

const revogarEmLote = asyncHandler(async (req, res) => {
  const { ids, motivo } = revogacaoEmLoteSchema.parse(req.body);
  const total = await certificadosService.revogarEmLote(req.params.edicaoId, ids, motivo);
  return res.json({ mensagem: `${total} ${total === 1 ? "certificado revogado" : "certificados revogados"}.` });
});

const pdf = asyncHandler(async (req, res) => {
  return enviarPdf(res, await certificadosService.pdfAdmin(req.params.edicaoId, req.params.id));
});

module.exports = {
  enviarPdf,
  listar,
  salvarModelo,
  previa,
  definirLiberacao,
  gerar,
  incluirManual,
  revogar,
  restaurar,
  revogarEmLote,
  pdf,
};
