const { Router } = require("express");
const anaisPublicoController = require("../controllers/anaisPublico.controller");
const { limitadorPadrao } = require("../middlewares/rateLimiter");

const router = Router();

// Páginas públicas dos Anais — só respondem com os Anais publicados.
router.get("/", anaisPublicoController.listarEdicoes);
router.get("/sitemap", anaisPublicoController.sitemap);
router.get("/artigos/:id/comentarios", anaisPublicoController.listarComentarios);
router.post("/artigos/:id/visualizacao", limitadorPadrao, anaisPublicoController.registrarVisualizacao);
router.get("/:edicaoSlug", anaisPublicoController.buscarAnais);
router.get("/:edicaoSlug/artigos/:slug", anaisPublicoController.buscarArtigo);
// Gera o PDF na hora (imagens do GCS + layout) — limitado por IP.
router.get("/:edicaoSlug/artigos/:slug/pdf", limitadorPadrao, anaisPublicoController.baixarPdfArtigo);

module.exports = router;
