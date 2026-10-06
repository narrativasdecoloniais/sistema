const { Router } = require("express");
const controller = require("../controllers/participanteCredenciamento.controller");
const { limitadorPorUsuario } = require("../middlewares/rateLimiter");

const router = Router();

router.get("/", controller.minhaSituacao);
// Antes de "/:token", que também casaria com "cracha".
router.get("/cracha", controller.meuCracha);
router.post("/cracha/novo", limitadorPorUsuario, controller.novoCracha);
router.get("/:token", limitadorPorUsuario, controller.previa);
router.post("/:token/evento", limitadorPorUsuario, controller.credenciarEvento);
router.post("/:token/atividade", limitadorPorUsuario, controller.registrarPresenca);

module.exports = router;
