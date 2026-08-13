const { Router } = require("express");
const atividadesController = require("../controllers/atividades.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

router.get("/", autorizarSecao("ATIVIDADES", "PROGRAMACAO"), atividadesController.listar);
router.get("/:id", autorizarSecao("ATIVIDADES", "PROGRAMACAO"), atividadesController.buscarPorId);
router.post("/", autorizarSecao("ATIVIDADES", "PROGRAMACAO"), atividadesController.criar);
router.patch("/:id", autorizarSecao("ATIVIDADES", "PROGRAMACAO"), atividadesController.atualizar);
router.patch("/:id/horario", autorizarSecao("ATIVIDADES", "PROGRAMACAO"), atividadesController.atualizarHorario);
router.delete("/:id", autorizarSecao("ATIVIDADES", "PROGRAMACAO"), atividadesController.excluir);

module.exports = router;
