const { Router } = require("express");
const gruposConteudoController = require("../controllers/gruposConteudo.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

router.get("/", autorizarSecao("GRUPOS_CONTEUDO"), gruposConteudoController.listar);
router.get("/:id", autorizarSecao("GRUPOS_CONTEUDO"), gruposConteudoController.buscarPorId);
router.post("/", autorizarSecao("GRUPOS_CONTEUDO"), gruposConteudoController.criar);
router.patch("/:id", autorizarSecao("GRUPOS_CONTEUDO"), gruposConteudoController.atualizar);
router.delete("/:id", autorizarSecao("GRUPOS_CONTEUDO"), gruposConteudoController.excluir);

module.exports = router;
