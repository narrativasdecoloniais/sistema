const { z } = require("zod");
const asyncHandler = require("../utils/asyncHandler");
const credenciamentoService = require("../services/credenciamento.service");
const { gerarPdfListasPresenca } = require("../services/pdfListaPresenca.service");

// Leitor da equipe: crachá (token) ou busca de reserva (usuarioId), nunca os dois.
const leituraSchema = z
  .object({
    token: z.string().trim().min(1).max(100).optional(),
    usuarioId: z.string().uuid().optional(),
    atividadeId: z.string().uuid().optional(),
    confirmar: z.boolean().optional(),
  })
  .refine((dados) => Boolean(dados.token) !== Boolean(dados.usuarioId), {
    message: "Informe o crachá lido ou o participante.",
  });

// Registro em lote (marcar quem assinou as listas impressas).
const loteSchema = z.object({
  usuarioIds: z.array(z.string().uuid()).min(1, "Selecione ao menos uma pessoa.").max(5000),
});

function enviarPdf(res, buffer, nomeArquivo) {
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    "Cache-Control": "no-store",
  });
  return res.send(buffer);
}

const ler = asyncHandler(async (req, res) => {
  const dados = leituraSchema.parse(req.body || {});
  return res.json(await credenciamentoService.lerNaEquipe(req.params.edicaoId, dados, req.usuario.id));
});

const listar = asyncHandler(async (req, res) => {
  return res.json(await credenciamentoService.listarCredenciamento(req.params.edicaoId));
});

const credenciar = asyncHandler(async (req, res) => {
  const resultado = await credenciamentoService.credenciarPelaEquipe(req.params.edicaoId, req.params.usuarioId, req.usuario.id);
  return res.json(resultado);
});

const desfazer = asyncHandler(async (req, res) => {
  const inscricao = await credenciamentoService.desfazerCredenciamento(req.params.edicaoId, req.params.usuarioId);
  return res.json({ inscricao, mensagem: "Credenciamento desfeito." });
});

const qrEvento = asyncHandler(async (req, res) => {
  return res.json(await credenciamentoService.qrEvento(req.params.edicaoId));
});

const novoQrEvento = asyncHandler(async (req, res) => {
  const qr = await credenciamentoService.qrEvento(req.params.edicaoId, { novo: true });
  return res.json({ ...qr, mensagem: "Novo QR code gerado. O anterior deixou de funcionar." });
});

const listarAtividades = asyncHandler(async (req, res) => {
  return res.json({ atividades: await credenciamentoService.listarAtividades(req.params.edicaoId) });
});

const qrTodasAtividades = asyncHandler(async (req, res) => {
  return res.json({ qrs: await credenciamentoService.qrTodasAtividades(req.params.edicaoId) });
});

const listarPresencas = asyncHandler(async (req, res) => {
  return res.json(await credenciamentoService.listarPresencas(req.params.edicaoId, req.params.atividadeId));
});

const qrAtividade = asyncHandler(async (req, res) => {
  return res.json(await credenciamentoService.qrAtividade(req.params.edicaoId, req.params.atividadeId));
});

const novoQrAtividade = asyncHandler(async (req, res) => {
  const qr = await credenciamentoService.qrAtividade(req.params.edicaoId, req.params.atividadeId, { novo: true });
  return res.json({ ...qr, mensagem: "Novo QR code gerado. O anterior deixou de funcionar." });
});

const registrarPresenca = asyncHandler(async (req, res) => {
  const resultado = await credenciamentoService.registrarPresencaPelaEquipe(
    req.params.edicaoId,
    req.params.atividadeId,
    req.params.usuarioId,
    req.usuario.id
  );
  return res.json(resultado);
});

const removerPresenca = asyncHandler(async (req, res) => {
  const inscricao = await credenciamentoService.removerPresenca(req.params.edicaoId, req.params.atividadeId, req.params.usuarioId);
  return res.json({ inscricao, mensagem: "Presença removida." });
});

const credenciarEmLote = asyncHandler(async (req, res) => {
  const { usuarioIds } = loteSchema.parse(req.body || {});
  const resultado = await credenciamentoService.credenciarEmLote(req.params.edicaoId, [...new Set(usuarioIds)], req.usuario.id);
  return res.json({
    ...resultado,
    mensagem:
      resultado.credenciados === 1 ? "1 pessoa credenciada." : `${resultado.credenciados} pessoas credenciadas.`,
  });
});

const registrarPresencasEmLote = asyncHandler(async (req, res) => {
  const { usuarioIds } = loteSchema.parse(req.body || {});
  const resultado = await credenciamentoService.registrarPresencasEmLote(
    req.params.edicaoId,
    req.params.atividadeId,
    [...new Set(usuarioIds)],
    req.usuario.id
  );
  return res.json({
    ...resultado,
    mensagem: resultado.registradas === 1 ? "1 presença registrada." : `${resultado.registradas} presenças registradas.`,
  });
});

const listaImpressaEvento = asyncHandler(async (req, res) => {
  const lista = await credenciamentoService.listaImpressaEvento(req.params.edicaoId);
  const buffer = await gerarPdfListasPresenca([lista], { titulo: `Lista de credenciamento — ${lista.evento}` });
  return enviarPdf(res, buffer, "lista-credenciamento-evento.pdf");
});

const listaImpressaAtividade = asyncHandler(async (req, res) => {
  const lista = await credenciamentoService.listaImpressaAtividade(req.params.edicaoId, req.params.atividadeId);
  const buffer = await gerarPdfListasPresenca([lista], { titulo: `Lista de presença — ${lista.titulo}` });
  return enviarPdf(res, buffer, "lista-presenca-atividade.pdf");
});

const listasImpressasAtividades = asyncHandler(async (req, res) => {
  const listas = await credenciamentoService.listasImpressasAtividades(req.params.edicaoId);
  const buffer = await gerarPdfListasPresenca(listas, { titulo: `Listas de presença — ${listas[0].evento}` });
  return enviarPdf(res, buffer, "listas-presenca-atividades.pdf");
});

module.exports = {
  credenciarEmLote,
  registrarPresencasEmLote,
  listaImpressaEvento,
  listaImpressaAtividade,
  listasImpressasAtividades,
  ler,
  listar,
  credenciar,
  desfazer,
  qrEvento,
  novoQrEvento,
  listarAtividades,
  qrTodasAtividades,
  listarPresencas,
  qrAtividade,
  novoQrAtividade,
  registrarPresenca,
  removerPresenca,
};
