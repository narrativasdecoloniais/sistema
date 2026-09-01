const { Router } = require("express");
const participanteInscricoesController = require("../controllers/participanteInscricoes.controller");

const router = Router();

router.get("/", participanteInscricoesController.listar);
router.get("/:edicaoId", participanteInscricoesController.buscarEstado);
router.post("/:edicaoId", participanteInscricoesController.inscrever);
router.delete(
  "/:edicaoId/atividades/:inscricaoAtividadeId",
  participanteInscricoesController.cancelarAtividade
);
router.delete("/:edicaoId", participanteInscricoesController.cancelarGeral);

module.exports = router;
