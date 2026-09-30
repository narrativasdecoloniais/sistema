const { Router } = require("express");
const certificadosController = require("../controllers/certificados.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

router.use(autorizarSecao("CERTIFICADOS"));

router.get("/", certificadosController.listar);
router.put("/modelos/:tipo", certificadosController.salvarModelo);
router.post("/modelos/:tipo/previa", certificadosController.previa);
router.post("/modelos/:tipo/gerar", certificadosController.gerar);
router.patch("/modelos/:tipo/liberacao", certificadosController.definirLiberacao);
router.post("/manual", certificadosController.incluirManual);
router.post("/revogacao-em-lote", certificadosController.revogarEmLote);
router.post("/:id/revogar", certificadosController.revogar);
router.post("/:id/restaurar", certificadosController.restaurar);
router.get("/:id/pdf", certificadosController.pdf);

module.exports = router;
