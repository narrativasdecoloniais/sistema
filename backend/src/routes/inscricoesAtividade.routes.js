const { Router } = require("express");
const inscricoesAtividadeController = require("../controllers/inscricoesAtividade.controller");
const autorizar = require("../middlewares/autorizar");

const router = Router({ mergeParams: true });

router.get("/", autorizar("ADMIN", "ORGANIZADOR"), inscricoesAtividadeController.listar);
router.post("/", autorizar("ADMIN", "ORGANIZADOR"), inscricoesAtividadeController.criar);
router.patch("/:id", autorizar("ADMIN", "ORGANIZADOR"), inscricoesAtividadeController.atualizar);
router.delete("/:id", autorizar("ADMIN", "ORGANIZADOR"), inscricoesAtividadeController.excluir);

module.exports = router;
