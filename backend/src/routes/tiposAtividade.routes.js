const { Router } = require("express");
const tiposAtividadeController = require("../controllers/tiposAtividade.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router();

router.use(autenticar);

router.get("/", autorizarSecao("TIPOS_ATIVIDADE"), tiposAtividadeController.listar);
router.get("/:id", autorizarSecao("TIPOS_ATIVIDADE"), tiposAtividadeController.buscarPorId);
// Mutação intencionalmente ADMIN-only: é catálogo global compartilhado
// entre todas as edições, não um recurso de uma edição específica.
router.post("/", autorizar("ADMIN"), tiposAtividadeController.criar);
router.patch("/:id", autorizar("ADMIN"), tiposAtividadeController.atualizar);
router.delete("/:id", autorizar("ADMIN"), tiposAtividadeController.excluir);

module.exports = router;
