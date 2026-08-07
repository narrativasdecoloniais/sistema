const { Router } = require("express");
const tiposParticipacaoController = require("../controllers/tiposParticipacao.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");

const router = Router();

router.use(autenticar);

router.get("/", autorizar("ADMIN", "ORGANIZADOR"), tiposParticipacaoController.listar);
router.get("/:id", autorizar("ADMIN", "ORGANIZADOR"), tiposParticipacaoController.buscarPorId);
router.post("/", autorizar("ADMIN"), tiposParticipacaoController.criar);
router.patch("/:id", autorizar("ADMIN"), tiposParticipacaoController.atualizar);
router.delete("/:id", autorizar("ADMIN"), tiposParticipacaoController.excluir);

module.exports = router;
