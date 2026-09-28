const { Router } = require("express");
const participanteAvaliacoesController = require("../controllers/participanteAvaliacoes.controller");

const router = Router();

router.get("/", participanteAvaliacoesController.listar);
router.get("/:atribuicaoId", participanteAvaliacoesController.buscar);
router.patch("/:atribuicaoId/decisao", participanteAvaliacoesController.registrarDecisao);
router.post("/:atribuicaoId/sugestao-area", participanteAvaliacoesController.sugerirArea);

module.exports = router;
