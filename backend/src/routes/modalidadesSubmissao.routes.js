const { Router } = require("express");
const modalidadesSubmissaoController = require("../controllers/modalidadesSubmissao.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

router.get("/", autorizarSecao("SUBMISSOES_MODALIDADES"), modalidadesSubmissaoController.listar);
router.get("/:id", autorizarSecao("SUBMISSOES_MODALIDADES"), modalidadesSubmissaoController.buscarPorId);
router.post("/", autorizarSecao("SUBMISSOES_MODALIDADES"), modalidadesSubmissaoController.criar);
router.patch("/:id", autorizarSecao("SUBMISSOES_MODALIDADES"), modalidadesSubmissaoController.atualizar);
router.delete("/:id", autorizarSecao("SUBMISSOES_MODALIDADES"), modalidadesSubmissaoController.excluir);

module.exports = router;
