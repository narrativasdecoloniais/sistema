const { Router } = require("express");
const publicoController = require("../controllers/publico.controller");
const inscricoesRoutes = require("./inscricoes.routes");
const { limitadorAuth } = require("../middlewares/rateLimiter");

const router = Router();

router.get("/edicao-atual", publicoController.buscarEdicaoAtual);
router.get("/edicoes-anteriores", publicoController.listarEdicoesAnteriores);
router.get("/programas-pos-graduacao", publicoController.listarProgramasPosGraduacao);
router.get("/edicao-atual/atividades", publicoController.listarAtividades);
router.get("/edicao-atual/atividades/:slug", publicoController.buscarAtividadePorSlug);
router.get("/edicao-atual/modalidades-submissao", publicoController.listarModalidadesSubmissao);
router.get(
  "/edicao-atual/modalidades-submissao/:slug",
  publicoController.buscarModalidadeSubmissaoPorSlug
);
router.get("/edicoes/:slug", publicoController.buscarEdicaoPorSlug);
router.get("/edicoes/:slug/atividades", publicoController.listarAtividadesPorEdicaoSlug);
router.get(
  "/edicoes/:edicaoSlug/atividades/:atividadeSlug",
  publicoController.buscarAtividadePorEdicaoSlug
);
router.use("/inscricao", limitadorAuth, inscricoesRoutes);

module.exports = router;
