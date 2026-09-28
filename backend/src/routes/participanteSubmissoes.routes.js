const { Router } = require("express");
const participanteSubmissoesController = require("../controllers/participanteSubmissoes.controller");

const router = Router();

router.get("/", participanteSubmissoesController.listarMinhas);
router.post("/verificar-email-autor", participanteSubmissoesController.verificarEmailAutor);
router.post("/", participanteSubmissoesController.criar);
router.get("/:id", participanteSubmissoesController.buscar);
router.patch("/:id/correcao", participanteSubmissoesController.corrigir);

module.exports = router;
