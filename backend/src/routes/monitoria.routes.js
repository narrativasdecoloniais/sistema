const { Router } = require("express");
const monitoriaController = require("../controllers/monitoria.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

// Dados pessoais (CPF, nascimento, autorização de menor) — só quem tem a
// seção MONITORIA (ADMIN sempre).
router.use(autorizarSecao("MONITORIA"));

router.get("/", monitoriaController.listar);
router.patch("/configuracao", monitoriaController.atualizarConfiguracao);
router.post("/status-em-lote", monitoriaController.definirStatusEmLote);
router.post("/divulgar", monitoriaController.divulgar);
router.post("/emails/reenviar", monitoriaController.reenviarPendentes);
router.patch("/:id/status", monitoriaController.definirStatus);
router.get("/:id/autorizacao", monitoriaController.urlAutorizacao);

module.exports = router;
