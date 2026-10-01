const { Router } = require("express");
const participanteSubmissoesController = require("../controllers/participanteSubmissoes.controller");
const { limitadorPorUsuario } = require("../middlewares/rateLimiter");

const router = Router();

router.get("/", participanteSubmissoesController.listarMinhas);
router.post("/verificar-email-autor", participanteSubmissoesController.verificarEmailAutor);
router.post("/", participanteSubmissoesController.criar);
router.get("/:id", participanteSubmissoesController.buscar);
router.get("/:id/previa", participanteSubmissoesController.previa);
router.patch("/:id/correcao", participanteSubmissoesController.corrigir);
// Só o autor principal, no máximo um reenvio a cada 24 h por coautor.
router.post(
  "/:id/autores/:autorId/convite",
  limitadorPorUsuario,
  participanteSubmissoesController.reenviarConviteCoautor
);

module.exports = router;
