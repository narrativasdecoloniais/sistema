const { Router } = require("express");
const inscricoesController = require("../controllers/inscricoes.controller");
const autenticarInscricao = require("../middlewares/autenticarInscricao");
const autenticar = require("../middlewares/autenticar");

const router = Router();

router.post("/cpf", inscricoesController.buscarPorCpf);
router.post("/confirmar-email", inscricoesController.confirmarEmailExistente);
router.post("/cadastro", inscricoesController.cadastrar);
router.get("/token-por-sessao", autenticar, inscricoesController.tokenPorSessao);
router.get("/estado", autenticarInscricao, inscricoesController.buscarEstado);
router.post("/finalizar", autenticarInscricao, inscricoesController.finalizar);
router.delete(
  "/atividades/:inscricaoAtividadeId",
  autenticarInscricao,
  inscricoesController.cancelarAtividade
);

module.exports = router;
