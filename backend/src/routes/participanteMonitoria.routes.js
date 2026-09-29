const { Router } = require("express");
const participanteMonitoriaController = require("../controllers/participanteMonitoria.controller");

const router = Router();

router.get("/:edicaoId", participanteMonitoriaController.buscar);
router.put("/:edicaoId", participanteMonitoriaController.salvar);
router.delete("/:edicaoId", participanteMonitoriaController.cancelar);

module.exports = router;
