const { Router } = require("express");
const publicoController = require("../controllers/publico.controller");
const inscricoesRoutes = require("./inscricoes.routes");
const { limitadorAuth } = require("../middlewares/rateLimiter");

const router = Router();

router.get("/edicao-atual", publicoController.buscarEdicaoAtual);
router.get("/edicao-atual/atividades", publicoController.listarAtividades);
router.get("/edicao-atual/atividades/:slug", publicoController.buscarAtividadePorSlug);
router.use("/inscricao", limitadorAuth, inscricoesRoutes);

module.exports = router;
