const { Router } = require("express");
const inscricoesController = require("../controllers/inscricoes.controller");
const autenticarInscricao = require("../middlewares/autenticarInscricao");
const autenticar = require("../middlewares/autenticar");
const { limitadorSensivel, limitadorPadrao } = require("../middlewares/rateLimiter");

const router = Router();

router.post("/cpf", limitadorPadrao, inscricoesController.buscarPorCpf);
router.post("/confirmar-email", limitadorSensivel, inscricoesController.confirmarEmailExistente);
router.post("/cadastro", limitadorPadrao, inscricoesController.cadastrar);
router.post("/vinculo/solicitar", limitadorSensivel, inscricoesController.solicitarVinculo);
router.post("/vinculo/confirmar", limitadorSensivel, inscricoesController.confirmarVinculo);
router.get("/token-por-sessao", autenticar, limitadorPadrao, inscricoesController.tokenPorSessao);
router.get("/estado", autenticarInscricao, limitadorPadrao, inscricoesController.buscarEstado);
router.post("/finalizar", autenticarInscricao, limitadorPadrao, inscricoesController.finalizar);
router.delete(
  "/atividades/:inscricaoAtividadeId",
  autenticarInscricao,
  limitadorPadrao,
  inscricoesController.cancelarAtividade
);

module.exports = router;
