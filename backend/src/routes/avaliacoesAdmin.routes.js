const { Router } = require("express");
const avaliacoesAdminController = require("../controllers/avaliacoesAdmin.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

// Convidar/remover avaliador não é ADMIN-only (diferente de organizadores):
// o papel AVALIADOR não dá acesso ao admin, então não há autopromoção.
router.use(autorizarSecao("SUBMISSOES_AVALIACAO"));

router.get("/avaliadores", avaliacoesAdminController.listarAvaliadores);
router.post("/avaliadores", avaliacoesAdminController.adicionarAvaliador);
router.patch("/avaliadores/:id", avaliacoesAdminController.atualizarAvaliador);
router.delete("/avaliadores/:id", avaliacoesAdminController.removerAvaliador);

router.get("/submissoes", avaliacoesAdminController.listarSubmissoes);
router.patch("/submissoes/:id/decisao-final", avaliacoesAdminController.definirDecisaoFinal);

router.post("/atribuicoes", avaliacoesAdminController.atribuir);
router.delete("/atribuicoes/:id", avaliacoesAdminController.removerAtribuicao);

router.get("/sugestoes", avaliacoesAdminController.listarSugestoes);
router.patch("/sugestoes/:id", avaliacoesAdminController.resolverSugestao);

module.exports = router;
