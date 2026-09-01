const { Router } = require("express");
const submissoesAdminController = require("../controllers/submissoesAdmin.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

router.get("/", autorizarSecao("SUBMISSOES_RECEBIMENTO"), submissoesAdminController.listar);
router.delete("/:id", autorizarSecao("SUBMISSOES_RECEBIMENTO"), submissoesAdminController.excluir);

module.exports = router;
