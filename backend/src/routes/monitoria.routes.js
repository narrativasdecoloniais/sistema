const { Router } = require("express");
const monitoriaController = require("../controllers/monitoria.controller");
const autorizar = require("../middlewares/autorizar");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

// Dados pessoais (CPF, nascimento, autorização de menor) — só quem tem a
// seção MONITORIA (ADMIN sempre).
router.use(autorizarSecao("MONITORIA"));

router.get("/", monitoriaController.listar);
// Só ADMIN: quem tem só a seção MONITORIA não pode se (ou a outros) dar acesso
// a mais seções escolhendo monitores.
router.put("/acesso-monitores", autorizar("ADMIN"), monitoriaController.definirAcessoMonitores);
router.patch("/configuracao", monitoriaController.atualizarConfiguracao);
router.post("/", monitoriaController.incluir);
router.post("/status-em-lote", monitoriaController.definirStatusEmLote);
router.post("/divulgar", monitoriaController.divulgar);
router.post("/emails/reenviar", monitoriaController.reenviarPendentes);
router.patch("/:id/status", monitoriaController.definirStatus);
router.get("/:id/autorizacao", monitoriaController.urlAutorizacao);

module.exports = router;
