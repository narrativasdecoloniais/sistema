const { Router } = require("express");
const atividadesController = require("../controllers/atividades.controller");
const autorizar = require("../middlewares/autorizar");

const router = Router({ mergeParams: true });

router.get("/", autorizar("ADMIN", "ORGANIZADOR"), atividadesController.listar);
router.get("/:id", autorizar("ADMIN", "ORGANIZADOR"), atividadesController.buscarPorId);
router.post("/", autorizar("ADMIN", "ORGANIZADOR"), atividadesController.criar);
router.patch("/:id", autorizar("ADMIN", "ORGANIZADOR"), atividadesController.atualizar);
router.delete("/:id", autorizar("ADMIN", "ORGANIZADOR"), atividadesController.excluir);

module.exports = router;
