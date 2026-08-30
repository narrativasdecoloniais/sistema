const { Router } = require("express");
const tiposComissaoController = require("../controllers/tiposComissao.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router();

router.use(autenticar);

router.get("/", autorizarSecao("TIPOS_COMISSAO"), tiposComissaoController.listar);
router.get("/:id", autorizarSecao("TIPOS_COMISSAO"), tiposComissaoController.buscarPorId);
// Mutação intencionalmente ADMIN-only: é catálogo global compartilhado
// entre todas as edições, não um recurso de uma edição específica.
router.post("/", autorizar("ADMIN"), tiposComissaoController.criar);
router.patch("/:id", autorizar("ADMIN"), tiposComissaoController.atualizar);
router.delete("/:id", autorizar("ADMIN"), tiposComissaoController.excluir);

module.exports = router;
