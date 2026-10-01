const { Router } = require("express");
const coautoresAdminController = require("../controllers/coautoresAdmin.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

// Submissões → Coautores. Mesma seção do Recebimento: é correção de dados
// dos trabalhos recebidos.
const router = Router({ mergeParams: true });

router.use(autorizarSecao("SUBMISSOES_RECEBIMENTO"));

router.get("/", coautoresAdminController.listar);
router.get("/convites/status", coautoresAdminController.statusEnvio);
router.post("/convites/enviar-pendentes", coautoresAdminController.enviarPendentes);
router.post("/convites/em-lote", coautoresAdminController.enviarEmLote);
router.patch("/:autorId", coautoresAdminController.atualizar);
router.patch("/:autorId/vinculo", coautoresAdminController.vincular);
router.delete("/:autorId", coautoresAdminController.excluir);

module.exports = router;
