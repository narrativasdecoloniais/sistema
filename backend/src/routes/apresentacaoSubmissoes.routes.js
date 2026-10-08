const { Router } = require("express");
const apresentacaoController = require("../controllers/apresentacaoSubmissoes.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

router.use(autorizarSecao("SUBMISSOES_APRESENTACAO"));

router.get("/", apresentacaoController.listar);
router.post("/vincular", apresentacaoController.vincular);
router.post("/desvincular", apresentacaoController.desvincular);
router.patch("/atividades/:atividadeId/ordem", apresentacaoController.reordenar);
router.post("/distribuir-por-area", apresentacaoController.distribuirPelaArea);
router.patch("/publicacao", apresentacaoController.publicar);
router.patch("/publicacao-publica", apresentacaoController.publicarAoPublico);
router.post("/avisos", apresentacaoController.enviarAvisos);

module.exports = router;
