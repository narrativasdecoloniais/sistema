const { Router } = require("express");
const submissoesController = require("../controllers/submissoesPublico.controller");
const autenticarSubmissao = require("../middlewares/autenticarSubmissao");
const autenticar = require("../middlewares/autenticar");

const router = Router();

router.get("/token-por-sessao", autenticar, submissoesController.tokenPorSessao);
router.post("/email", submissoesController.enviarLinkEntrada);
router.post("/cadastro", submissoesController.cadastrar);
router.post("/entrar", submissoesController.entrar);
router.post("/verificar-email-autor", autenticarSubmissao, submissoesController.verificarEmailAutor);
router.post("/", autenticarSubmissao, submissoesController.criar);

module.exports = router;
