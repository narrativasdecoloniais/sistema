const { Router } = require("express");
const regularizacaoController = require("../controllers/regularizacaoContas.controller");
const { limitadorSensivel, limitadorPadrao } = require("../middlewares/rateLimiter");

// Temporário (edição V) — ver services/regularizacaoContas.service.js. A
// busca por nome é pública, então fica no limite baixo por IP.
const router = Router();

router.post("/buscar", limitadorSensivel, regularizacaoController.buscar);
router.post("/previa", limitadorPadrao, regularizacaoController.previa);
router.post("/codigos", limitadorSensivel, regularizacaoController.enviarCodigos);
router.post("/confirmar", limitadorSensivel, regularizacaoController.confirmar);

module.exports = router;
