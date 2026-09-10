const { Router } = require("express");
const submissoesController = require("../controllers/submissoesPublico.controller");
const autenticarSubmissao = require("../middlewares/autenticarSubmissao");
const autenticar = require("../middlewares/autenticar");
const { limitadorSensivel, limitadorPadrao } = require("../middlewares/rateLimiter");

const router = Router();

router.get("/token-por-sessao", autenticar, limitadorPadrao, submissoesController.tokenPorSessao);
router.post("/email", limitadorSensivel, submissoesController.enviarLinkEntrada);
router.post("/cadastro", limitadorSensivel, submissoesController.cadastrar);
router.post("/entrar", limitadorPadrao, submissoesController.entrar);
router.post(
  "/verificar-email-autor",
  autenticarSubmissao,
  limitadorPadrao,
  submissoesController.verificarEmailAutor
);
router.post("/", autenticarSubmissao, limitadorPadrao, submissoesController.criar);

module.exports = router;
