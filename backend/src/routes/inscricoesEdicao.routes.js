const { Router } = require("express");
const inscricoesEdicaoController = require("../controllers/inscricoesEdicao.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

router.get("/", autorizarSecao("INSCRICOES_GERAIS"), inscricoesEdicaoController.listar);
router.post("/", autorizarSecao("INSCRICOES_GERAIS"), inscricoesEdicaoController.criar);
router.delete("/:id", autorizarSecao("INSCRICOES_GERAIS"), inscricoesEdicaoController.excluir);

module.exports = router;
