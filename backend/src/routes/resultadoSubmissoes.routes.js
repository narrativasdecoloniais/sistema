const { Router } = require("express");
const resultadoController = require("../controllers/resultadoSubmissoes.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

router.use(autorizarSecao("SUBMISSOES_RESULTADO"));

router.get("/", resultadoController.resumo);
router.get("/trabalhos", resultadoController.listarTrabalhos);
router.patch("/trabalhos/:id/observacao", resultadoController.atualizarObservacao);
router.patch("/trabalhos/:id/correcao", resultadoController.conferirCorrecao);
router.patch("/prazo", resultadoController.definirPrazo);
router.post("/divulgar", resultadoController.divulgar);
router.get("/previa-emails", resultadoController.previaEmails);
router.post("/enviar-emails", resultadoController.enviarEmails);
router.get("/modelos-email", resultadoController.listarModelosEmail);
router.patch("/modelos-email/:decisao", resultadoController.salvarModeloEmail);
router.post("/modelos-email/:decisao/teste", resultadoController.enviarTesteEmail);

module.exports = router;
