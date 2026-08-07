const { Router } = require("express");
const inscricoesEdicaoController = require("../controllers/inscricoesEdicao.controller");
const autorizar = require("../middlewares/autorizar");

const router = Router({ mergeParams: true });

router.get("/", autorizar("ADMIN", "ORGANIZADOR"), inscricoesEdicaoController.listar);
router.post("/", autorizar("ADMIN", "ORGANIZADOR"), inscricoesEdicaoController.criar);
router.delete("/:id", autorizar("ADMIN", "ORGANIZADOR"), inscricoesEdicaoController.excluir);

module.exports = router;
