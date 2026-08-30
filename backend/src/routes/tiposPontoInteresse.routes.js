const { Router } = require("express");
const tiposPontoInteresseController = require("../controllers/tiposPontoInteresse.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router();

router.use(autenticar);

router.get("/", autorizarSecao("TIPOS_PONTO_INTERESSE"), tiposPontoInteresseController.listar);
router.get("/:id", autorizarSecao("TIPOS_PONTO_INTERESSE"), tiposPontoInteresseController.buscarPorId);
// Mutação intencionalmente ADMIN-only: é catálogo global compartilhado
// entre todas as edições, não um recurso de uma edição específica.
router.post("/", autorizar("ADMIN"), tiposPontoInteresseController.criar);
router.patch("/:id", autorizar("ADMIN"), tiposPontoInteresseController.atualizar);
router.delete("/:id", autorizar("ADMIN"), tiposPontoInteresseController.excluir);

module.exports = router;
