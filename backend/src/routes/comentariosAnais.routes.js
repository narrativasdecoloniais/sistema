const { Router } = require("express");
const comentariosAnaisController = require("../controllers/comentariosAnais.controller");
const autenticar = require("../middlewares/autenticar");
const { limitadorPorUsuario } = require("../middlewares/rateLimiter");

const router = Router();

// Comentar nos Anais exige conta (qualquer papel); publica na hora e a
// organização modera depois (routes/anais.routes.js).
router.use(autenticar);
router.use(limitadorPorUsuario);

router.post("/artigos/:id/comentarios", comentariosAnaisController.criar);
router.delete("/comentarios/:id", comentariosAnaisController.excluir);

module.exports = router;
