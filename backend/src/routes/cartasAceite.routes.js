const { Router } = require("express");
const cartasAceiteController = require("../controllers/cartasAceite.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

// Mesma permissão do Resultado — a carta sai da decisão divulgada.
router.use(autorizarSecao("SUBMISSOES_RESULTADO"));

router.get("/", cartasAceiteController.listar);
router.put("/modelo", cartasAceiteController.salvarModelo);
router.post("/modelo/previa", cartasAceiteController.previa);
router.post("/gerar", cartasAceiteController.gerar);
router.post("/envio-email", cartasAceiteController.enviarPorEmail);
router.post("/envio-email/retomar", cartasAceiteController.retomarEnvioEmail);
router.post("/revogacao-em-lote", cartasAceiteController.revogarEmLote);
router.post("/:id/revogar", cartasAceiteController.revogar);
router.post("/:id/restaurar", cartasAceiteController.restaurar);
router.get("/:id/pdf", cartasAceiteController.pdf);

module.exports = router;
