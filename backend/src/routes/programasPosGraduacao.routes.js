const { Router } = require("express");
const programasPosGraduacaoController = require("../controllers/programasPosGraduacao.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router();

router.use(autenticar);

router.get("/", autorizarSecao("PROGRAMAS_POS_GRADUACAO"), programasPosGraduacaoController.listar);
router.get("/:id", autorizarSecao("PROGRAMAS_POS_GRADUACAO"), programasPosGraduacaoController.buscarPorId);
// Mutação intencionalmente ADMIN-only: é catálogo global compartilhado
// entre todas as edições, não um recurso de uma edição específica (mesma
// regra de tiposAtividade.routes.js).
router.post("/", autorizar("ADMIN"), programasPosGraduacaoController.criar);
router.patch("/:id", autorizar("ADMIN"), programasPosGraduacaoController.atualizar);
router.delete("/:id", autorizar("ADMIN"), programasPosGraduacaoController.excluir);

module.exports = router;
