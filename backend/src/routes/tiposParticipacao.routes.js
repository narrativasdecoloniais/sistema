const { Router } = require("express");
const tiposParticipacaoController = require("../controllers/tiposParticipacao.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router();

router.use(autenticar);

router.get("/", autorizarSecao("TIPOS_PARTICIPACAO"), tiposParticipacaoController.listar);
router.get("/:id", autorizarSecao("TIPOS_PARTICIPACAO"), tiposParticipacaoController.buscarPorId);
// Mutação intencionalmente ADMIN-only: é catálogo global compartilhado
// entre todas as edições, não um recurso de uma edição específica.
router.post("/", autorizar("ADMIN"), tiposParticipacaoController.criar);
router.patch("/:id", autorizar("ADMIN"), tiposParticipacaoController.atualizar);
router.delete("/:id", autorizar("ADMIN"), tiposParticipacaoController.excluir);

module.exports = router;
