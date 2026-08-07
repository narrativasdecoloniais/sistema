const { Router } = require("express");
const tiposAtividadeController = require("../controllers/tiposAtividade.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");

const router = Router();

router.use(autenticar);

router.get("/", autorizar("ADMIN", "ORGANIZADOR"), tiposAtividadeController.listar);
router.get("/:id", autorizar("ADMIN", "ORGANIZADOR"), tiposAtividadeController.buscarPorId);
router.post("/", autorizar("ADMIN"), tiposAtividadeController.criar);
router.patch("/:id", autorizar("ADMIN"), tiposAtividadeController.atualizar);
router.delete("/:id", autorizar("ADMIN"), tiposAtividadeController.excluir);

module.exports = router;
