const { Router } = require("express");
const modalidadesSubmissaoController = require("../controllers/modalidadesSubmissao.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

// Leitura também liberada pras telas de Recebimento, Avaliação e Resultado, que filtram
// e distribuem por modalidade/área mas não editam o catálogo.
router.get(
  "/",
  autorizarSecao("SUBMISSOES_MODALIDADES", "SUBMISSOES_RECEBIMENTO", "SUBMISSOES_AVALIACAO", "SUBMISSOES_RESULTADO"),
  modalidadesSubmissaoController.listar
);
router.get("/:id", autorizarSecao("SUBMISSOES_MODALIDADES"), modalidadesSubmissaoController.buscarPorId);
router.post("/", autorizarSecao("SUBMISSOES_MODALIDADES"), modalidadesSubmissaoController.criar);
router.patch("/:id", autorizarSecao("SUBMISSOES_MODALIDADES"), modalidadesSubmissaoController.atualizar);
router.delete("/:id", autorizarSecao("SUBMISSOES_MODALIDADES"), modalidadesSubmissaoController.excluir);

module.exports = router;
