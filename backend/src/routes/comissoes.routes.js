const { Router } = require("express");
const comissoesController = require("../controllers/comissoes.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

router.get("/", autorizarSecao("COMISSOES"), comissoesController.listar);
router.get("/:id", autorizarSecao("COMISSOES"), comissoesController.buscarPorId);
router.post("/", autorizarSecao("COMISSOES"), comissoesController.criar);
router.patch("/:id", autorizarSecao("COMISSOES"), comissoesController.atualizar);
router.delete("/:id", autorizarSecao("COMISSOES"), comissoesController.excluir);

module.exports = router;
