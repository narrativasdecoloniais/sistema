const { z } = require("zod");
const asyncHandler = require("../utils/asyncHandler");
const credenciamentoService = require("../services/credenciamento.service");

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

module.exports = {
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
