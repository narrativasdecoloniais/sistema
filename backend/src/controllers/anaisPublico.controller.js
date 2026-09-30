const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const anaisService = require("../services/anais.service");
const geracaoAnaisService = require("../services/geracaoAnais.service");
const { gerarSlug } = require("../utils/slug");

const listarEdicoes = asyncHandler(async (req, res) => {
  return res.json({ edicoes: await anaisService.listarEdicoesComAnais() });
});

const sitemap = asyncHandler(async (req, res) => {
  return res.json({ edicoes: await anaisService.listarSitemap() });
});

const buscarAnais = asyncHandler(async (req, res) => {
  const dados = await anaisService.buscarAnaisPublicos(req.params.edicaoSlug);
  if (!dados) throw new ErroHttp(404, "Anais não encontrados.");
  return res.json(dados);
});

const buscarArtigo = asyncHandler(async (req, res) => {
  const dados = await anaisService.buscarArtigoPublico(req.params.edicaoSlug, req.params.slug);
  if (!dados) throw new ErroHttp(404, "Trabalho não encontrado nos Anais.");
  return res.json(dados);
});

// PDF individual do trabalho, gerado na hora com o mesmo layout dos Anais.
const baixarPdfArtigo = asyncHandler(async (req, res) => {
  const { edicaoSlug, slug } = req.params;
  const { buffer, artigoId } = await geracaoAnaisService.gerarPdfArtigo(edicaoSlug, slug);
  await anaisService.registrarDownload(artigoId);
  const nomeArquivo = `${gerarSlug(slug, 60) || "trabalho"}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Content-Length", buffer.length);
  res.setHeader("Cache-Control", "no-store");
  return res.end(buffer);
});

const registrarVisualizacao = asyncHandler(async (req, res) => {
  await anaisService.registrarVisualizacao(req.params.id);
  return res.status(204).end();
});

const listarComentarios = asyncHandler(async (req, res) => {
  return res.json({ comentarios: await anaisService.listarComentariosPublicos(req.params.id) });
});

module.exports = {
  listarEdicoes,
  sitemap,
  buscarAnais,
  buscarArtigo,
  baixarPdfArtigo,
  registrarVisualizacao,
  listarComentarios,
};
